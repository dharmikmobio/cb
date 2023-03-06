'use strict';

/**
 * pdf-to-text controller
 */

const { convertRestQueryParams } = require('strapi-utils');
const path = require('path');
const fs = require('fs');
const url = require("url");
const { PutObjectCommand,
  S3Client } = require("@aws-sdk/client-s3");
const { awaitRequest, openai } = require('../../../../utils');
const axios = require("axios");
const { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } = require("@aws-sdk/client-textract");

module.exports = {

  linkPdfToText: async (ctx, next) => {

    const queryParams = ctx.request.query;
    const fileResponse = await axios.get(queryParams.file, { "responseType": "stream" });
    const { X_RAPIDAPI_KEY,
      AWS_BUCKET,
      AWS_ACCESS_KEY_ID,
      AWS_ACCESS_SECRET,
      AWS_REGION
    } = process.env
    let isLogin = false;
    let userId;

    if (ctx.state.user?.id) {
      userId = ctx.state.user.id;
      isLogin = true;
    }

    if (fileResponse.error === undefined) {
      const options = {
        method: 'POST',
        url: 'https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert',
        headers: {
          'content-type': 'multipart/form-data; boundary=---011000010111000001101001',
          'X-RapidAPI-Key': X_RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'pdf-to-text-converter.p.rapidapi.com',
          useQueryString: true
        },
        formData: {
          file: fileResponse.data,
          page: queryParams.page
        }
      };
      const pdfToTextRes = await awaitRequest(options)

      const body = await axios.get(queryParams.file, { "responseType": "arraybuffer" })
      let filename
      if (body.error === undefined) {
        const client = new S3Client({
          region: AWS_REGION,
          credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_ACCESS_SECRET
          }
        })
        const parsed = url.parse(queryParams.file)
        filename = path.basename(parsed.pathname).replace(/ /g, '')
        const params = {
          Bucket: AWS_BUCKET,
          Key: `common/files/docs/${filename}`,
          Body: body.data,
          ACL: 'public-read'
        }
        await client.send(new PutObjectCommand(params))
      }

      if (queryParams.openai != undefined) {

        const promptsData = await strapi.entityService.findMany('api::internal-ai-prompt.internal-ai-prompt', {
          filters: { promptType: 'Text or Code OCR' }
        });

        const words = promptsData[0].inputWords;
        const textForOpenai = pdfToTextRes.split(/\s+/).slice(0, words).join(" ");
        
        const prompt = promptsData[0].prompt.replace(/{text}/g, textForOpenai);
        const openaiRes = await openai(prompt);
        
        const correction = openaiRes.split('Correction: ')[1];

        const createGem = await strapi.service('api::gem.gem').create({
          data: {
            url: queryParams.file,
            title: filename,
            text: correction,
            S3_link: [`${process.env.AWS_BASE_URL}/common/files/docs/${filename}`],
            media_type: 'PDF',
            FileName: filename
          }
        })

        /* logs data for converting pdf to text*/
        if (isLogin === true) {
          await strapi.entityService.create("api::activity-log.activity-log", {
            data: {
              action_type: "Converted pdf url to text",
              action: "create",
              module: "gem",
              action_owner: userId,
              success_msg: "Converted pdf url to text successfully",
              new_result: {
                url: queryParams.file,
                title: filename,
                text: correction,
                S3_link: [
                  `${process.env.AWS_BASE_URL}/common/files/docs/${filename}`,
                ],
                media_type: "PDF",
                FileName: filename,
              },
              gem: createGem.id,
              publishedAt: new Date().toISOString(),
            },
          });
        }

        ctx.send(createGem);
      }
      else {
        const createGem = await strapi.service('api::gem.gem').create({
          data: {
            url: queryParams.file,
            title: filename,
            text: pdfToTextRes,
            S3_link: [`${process.env.AWS_BASE_URL}/common/files/docs/${filename}`],
            media_type: 'PDF',
            FileName: filename
          }
        })

        /* logs data for converting pdf to text */
        if (isLogin === true) {
          await strapi.entityService.create("api::activity-log.activity-log", {
            data: {
              action_type: "Converted pdf url to text",
              action: "create",
              module: "gem",
              action_owner: userId,
              success_msg: "Converted pdf url to text successfully",
              new_result: {
                url: queryParams.file,
                title: filename,
                text: pdfToTextRes,
                S3_link: [
                  `${process.env.AWS_BASE_URL}/common/files/docs/${filename}`,
                ],
                media_type: "PDF",
                FileName: filename,
              },
              gem: createGem.id,
              publishedAt: new Date().toISOString(),
            },
          });
        }

        ctx.send(createGem);
      }

    }
    else {
      ctx.send({ status: 400, message: "File is not valid please check the file!" })
    }

  },

  pdfStore: async (ctx, next) => {
    try {
      const queryParams = ctx.request.query;
      const data = await strapi.service('api::pdf-to-text.pdf-text').pdfStore(queryParams);

      ctx.send(data)
    } catch (error) {
      ctx.send({ status: 400, message: error });
    }
  },

  createHighlightPdf: async (ctx, next) => {
    try {
      const body = ctx.request.body;
      const userId = ctx.state.user.id;

      const data = await strapi.service('api::pdf-to-text.pdf-text').createHighlightPdf(body, userId);

      ctx.send(data);
    } catch (error) {
      ctx.send({ status: 400, message: error });
    };
  },

  getPdfHighlight: async (ctx, next) => {
    try {
      const filter = ctx.request.query.url;
      const type = ctx.request.query.type;
      const userId = ctx.state.user.id;

      const data = await strapi.service('api::pdf-to-text.pdf-text').getPdfHighlight(filter, userId, type);

      ctx.send(data);
    } catch (error) {
      ctx.send({ status: 400, message: error });
    };
  },

  getPdfHighlightById: async (ctx, next) => {
    try {
      const params = ctx.params.gemId;

      const data = await strapi.service('api::pdf-to-text.pdf-text').getPdfHighlightById(params);

      ctx.send(data);
    } catch (error) {
      ctx.send({ status: 400, message: error });
    };
  },

  updatePdfHighlight: async (ctx, next) => {
    try {

      const body = ctx.request.body;
      const params = ctx.params.gemId;

      const data = await strapi.service('api::pdf-to-text.pdf-text').updatePdfHighlight(body, params);

      ctx.send(data)
    } catch (error) {
      ctx.send({ status: 400, message: error });
    };
  },

  deletePdfHighlight: async (ctx, next) => {
    try {
      const params = ctx.params.gemId;

      const data = await strapi.service('api::pdf-to-text.pdf-text').deletePdfHighlight(params);

      ctx.send("Data Deleted")
    } catch (error) {
      ctx.send({ status: 400, message: error });
    };
  },




  getPdfToText: async (ctx, next) => {
    const filter = convertRestQueryParams(ctx.request.query);
    const URL = filter.where;
    const files = ctx.request.files;
    const file = files.file;
    const filename = file.name.replace(/ /g, '');
    const absolutePath = path.join(file.path);
    const { X_RAPIDAPI_KEY,
      AWS_BUCKET,
      AWS_ACCESS_KEY_ID,
      AWS_ACCESS_SECRET,
      AWS_REGION
    } = process.env;

    let isLogin = false;
    let userId;
    if (ctx.state.user?.id) {
      isLogin = true
      userId = ctx.state.user.id
    }

    const options = {
      method: 'POST',
      url: 'https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert',
      headers: {
        'content-type': 'multipart/form-data; boundary=---011000010111000001101001',
        'X-RapidAPI-Key': X_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'pdf-to-text-converter.p.rapidapi.com',
        useQueryString: true
      },
      formData: {
        file: {
          value: fs.createReadStream(absolutePath),
          options: {
            filename: filename,
            contentType: 'application/octet-stream'
          }
        },
        page: ctx.request.body.page
      }
    };

    const pdfToTextRes = await awaitRequest(options)

    let fileStream = fs.createReadStream(absolutePath)

    const client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_ACCESS_SECRET
      }
    })

    const params = {
      Bucket: AWS_BUCKET,
      Key: `common/files/docs/${filename}`,
      Body: fileStream,
      ACL: 'public-read',
      ContentType: file.type
    }

    await client.send(new PutObjectCommand(params));



    console.log("s3Link ====> ", `${process.env.AWS_BASE_URL}/common/files/docs/${filename}`);


    const textract = new TextractClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_ACCESS_SECRET
      }
    });

    const paramsData = {
      DocumentLocation: {
        S3Object: {
          Bucket: AWS_BUCKET, // This will be the same bucket that you use to save the file
          Name: `common/files/docs/${filename}`,
        },
      },
      FeatureTypes: ['FORMS', 'TABLES']
    };

    const startDocumentAnalysisCommand = new StartDocumentAnalysisCommand(paramsData);
    const commandId = await textract.send(startDocumentAnalysisCommand);
    console.log(":::::::::::::::::::::", commandId)
    
    const paramObj    = { JobId: commandId.JobId }

    // if (NextToken) paramsData.NextToken = null;

    const getDocumentAnalysisCommand = new GetDocumentAnalysisCommand(paramObj)
    const data = await textract.send(getDocumentAnalysisCommand);
    console.log("::::DATA::::", data);

    // let response = await getOneJob(paramsJobId);
    // if (response.JobStatus === "IN_PROGRESS") {
    //   return { message: "Job not finished yet." }
    // }
    // if (response.JobStatus === "FAILED") {
    //   return { message: "Job failed." }
    // }
    // saveResponse(response);

    // while(!isNull(response.NextToken)) {
    //   response = await getOneJob(jobId, response.NextToken);
    //   saveResponse(response);
    // }

    // return getAllSavedResponses(jobId);

    return data;





    if (URL != undefined) {

      const promptsData = await strapi.entityService.findMany('api::internal-ai-prompt.internal-ai-prompt', {
        filters: { promptType: 'Text or Code OCR' }
      });

      const words = promptsData[0].inputWords;
      const textForOpenai = pdfToTextRes.split(/\s+/).slice(0, words).join(" ");
      
      const prompt = promptsData[0].prompt.replace(/{text}/g, textForOpenai);
      const openaiRes = await openai(prompt);
      
      const correction = openaiRes.split('Correction: ')[1];

      const createGemData = await strapi.service('api::gem.gem').create({
        data: {
          title: filename,
          text: correction,
          S3_link: [`${process.env.AWS_BASE_URL}/common/files/docs/${filename}`],
          media_type: 'PDF',
          FileName: filename
        }
      })

      /* logs data for converting pdf to text*/
      if (isLogin === true) {
        await strapi.entityService.create("api::activity-log.activity-log", {
          data: {
            action_type: "Converted pdf to text",
            action: "create",
            module: "gem",
            action_owner: userId,
            success_msg: "Converted pdf file to text successfully",
            new_result: {
              title: filename,
              text: correction,
              S3_link: [
                `${process.env.AWS_BASE_URL}/common/files/docs/${filename}`,
              ],
              media_type: "PDF",
              FileName: filename,
            },
            gem: createGemData.id,
            publishedAt: new Date().toISOString(),
          },
        });
      }

      ctx.send(createGemData)
    } else {
      const createGemData = await strapi.service('api::gem.gem').create({
        data: {
          title: filename,
          text: pdfToTextRes.replace(/\n/g, '').replace(/\t/g, ''),
          S3_link: [`${process.env.AWS_BASE_URL}/common/files/docs/${filename}`],
          media_type: 'PDF',
          FileName: filename
        }
      })

      /* logs data for converting pdf to text */
      if (isLogin === true) {
        await strapi.entityService.create("api::activity-log.activity-log", {
          data: {
            action_type: "Converted pdf to text",
            action: "create",
            module: "gem",
            action_owner: userId,
            success_msg: "Converted pdf file to text successfully",
            new_result: {
              title: filename,
              text: pdfToTextRes.replace(/\n/g, "").replace(/\t/g, ""),
              S3_link: [
                `${process.env.AWS_BASE_URL}/common/files/docs/${filename}`,
              ],
              media_type: "PDF",
              FileName: filename,
            },
            gem: createGemData.id,
            publishedAt: new Date().toISOString(),
          },
        });
      }


      ctx.send(createGemData)
    }

  }
}