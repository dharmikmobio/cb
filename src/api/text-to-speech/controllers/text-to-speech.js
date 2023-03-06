'use strict';

/**
 * text-to-speech controller
 */
const { createCoreController } = require('@strapi/strapi').factories;
const {PutObjectCommand, S3Client} = require('@aws-sdk/client-s3');
const {PollyClient,SynthesizeSpeechCommand} = require('@aws-sdk/client-polly');
const { AWS_BUCKET, AWS_ACCESS_KEY_ID, AWS_ACCESS_SECRET, AWS_REGION , AWS_BASE_URL } = process.env;

module.exports = createCoreController('api::text-to-speech.text-to-speech',({strapi})=>({
      
    async convertingTextToSpeech( ctx){
        try { 
            const userId = ctx.state.user.id; 
            const body = ctx.request.body;
            const {text,url} = body;
            const textLimit = 250;   
            const countWord = text.split(" ");
            let start = 0;
            let end = textLimit;    
            let pollyStreamRes = [];
            let polly;
            let updatedRes;
            /* First checking url is already exists or not ? */
            const existsUrl = await strapi.db.query('api::text-to-speech.text-to-speech').findOne({
               where:{
                   url:url
               },
               populate:true
            })
             
            if(existsUrl){
                 updatedRes = {
                    ...existsUrl,
                    author:{
                     id:existsUrl.author.id,
                     name:existsUrl.author.username,
                     email:existsUrl.author.email 
                    }
                }
                return ctx.send({msg:'This url is already converted text-to-speechify', data:updatedRes});
            }

            if(countWord.length > textLimit ){
                 while(countWord.length > end){
                     polly= await this.pollyUtils(countWord,start,end); 
                     pollyStreamRes.push(polly);   
                      start = end
                      end = end + textLimit; 
                  }
                  const leftWord = countWord.length % textLimit;
                  end = start + leftWord;
                  polly = await this.pollyUtils(countWord,start,end); 
                  pollyStreamRes.push(polly);

            }else{
              polly=await this.pollyUtils(countWord,start,countWord.length);
              pollyStreamRes.push(polly); 
            }
           
           let finalAudioStream = [];
           
           for(const polly of pollyStreamRes){
              const streamData=await polly.AudioStream.transformToByteArray();
              finalAudioStream = [...finalAudioStream,...streamData];
           } 
           
           /* Merging multiple byteArray chunks data into single byteArray */
           const bufferData = new Uint8Array(finalAudioStream); 
           
           /* Storing polly converted file to s3 bucket into mp3 format */
            
            const s3Client = new S3Client({
                credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_ACCESS_SECRET,
                },
            });
                
            const params = {
                Bucket: AWS_BUCKET,
                Key: `common/text-to-speechify/${Date.now()}.mp3`,
                Body: bufferData,
                ContentType: pollyStreamRes[0].ContentType,
                ACL: "public-read",
            };
            await s3Client.send(new PutObjectCommand(params));
            
           const speechifyData =  await strapi.entityService.create('api::text-to-speech.text-to-speech',
                { 
                    data: {
                        audio_url:`${AWS_BASE_URL}/${params.Key}`,
                        url: url,
                        author:userId,
                        publishedAt: new Date().toISOString()        
                    }
                }
            )
            
            const responseData = await strapi.db.query('api::text-to-speech.text-to-speech').findOne({
                where:{
                    id:speechifyData.id
                },
                populate:true
             })
            
             updatedRes = {
                ...responseData,
                author:{
                 id:responseData.author.id,
                 name:responseData.author.username,
                 email:responseData.author.email 
                }
             }
             ctx.send({msg:'Converted text-to-speechify successfully...',data:updatedRes}); 
        
        }catch(err){
            console.log("error occured :",err);
        }  

    },
     
    async pollyUtils(textInput,start,end){
          let texts = '';
          for(let i=start;i<end;i++){
              texts=texts+textInput[i]+" ";        
          }  
          const pollyClient = new PollyClient({
            region:AWS_REGION,
             credentials:{
                accessKeyId:AWS_ACCESS_KEY_ID,
                secretAccessKey:AWS_ACCESS_SECRET
             }
          })
          const pollyParams = {
               OutputFormat: "mp3", 
                SampleRate: "8000", 
                Text: texts, 
                VoiceId: "Joanna"   
          };
          return await pollyClient.send(new SynthesizeSpeechCommand(pollyParams))  
    } 

}));
