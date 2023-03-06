'use strict';

/**
 * gem service
 */

const { createCoreService }             = require('@strapi/strapi').factories;
const { AWS_BUCKET, AWS_ACCESS_KEY_ID, 
        AWS_ACCESS_SECRET, AWS_REGION } = process.env;
        const path = require("path");
const fs                                = require("fs");
const { PutObjectCommand, S3Client }    = require("@aws-sdk/client-s3");

module.exports = createCoreService('api::gem.gem', ({strapi}) => ({

    updateBookmarkMedia: (files) => {
        const filesSelect = files?.length ? "mutiple" : "single";
        const client      = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_ACCESS_SECRET,
            },
        });
        
        const promiseArr = [];
        if (filesSelect === "single") {
            const fileObj = files;

            const absolutePath = path.join(fileObj.path);
            const filename = fileObj.name.replace(/ /g, "");
            let fileStream = fs.createReadStream(absolutePath);
            const params = {
                Bucket: AWS_BUCKET,
                Key: `common/images/bookmark_images/${filename}`,
                Body: fileStream,
                ContentType: fileObj.type,
                ACL: "public-read",
            };
            promiseArr.push(new Promise((resolve, reject) => {
                client.send(new PutObjectCommand(params)).then((res) => {
                    resolve(`${process.env.AWS_BASE_URL}/common/images/bookmark_images/${filename}`)
                });
            }))
            return promiseArr
        } 
        for (const fileObj of files) {
            const absolutePath = path.join(fileObj.path);
            const filename = fileObj.name.replace(/ /g, "");
            let fileStream = fs.createReadStream(absolutePath);

            const params = {
                Bucket: AWS_BUCKET,
                Key: `common/images/bookmark_images/${filename}`,
                Body: fileStream,
                ContentType: fileObj.type,
                ACL: "public-read",
            };

            promiseArr.push(new Promise((resolve, reject) => {
                client.send(new PutObjectCommand(params)).then((res) => {
                    resolve(`${process.env.AWS_BASE_URL}/common/images/bookmark_images/${filename}`)
                });
            }))
        }
        return promiseArr
    },

    uploadImageFromBase64: (base64, path) => {
        return new Promise((resolve, reject) => {
            const buf       = new Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64')
            const type      = base64.split(';')[0].split('/')[1];
            const params    = {
                Bucket: AWS_BUCKET,
                Key: path,
                Body: buf,
                ContentEncoding: 'base64',
                ContentType: `image/${type}`,
                ACL: "public-read",
            };
            const client      = new S3Client({
                region: AWS_REGION,
                credentials: {
                    accessKeyId: AWS_ACCESS_KEY_ID,
                    secretAccessKey: AWS_ACCESS_SECRET,
                },
            });
            client.send(new PutObjectCommand(params), (res) => {
                resolve(`${process.env.AWS_BASE_URL}/${path}`)
            })
        })
    },
   
    updateGem: async (url, body) => {

        let gemId;
        url.map(data => {
            gemId = data.value
        });

        const entry = await strapi.entityService.findMany('api::gem.gem', {
            filters: {id: gemId}
        });

        let updateId = entry[0].id;

        const updatedGem = await strapi.entityService.update('api::gem.gem', updateId, {
            data: {
                ...entry,
                url: body.data.url,
                title: body.data.title,
                description: body.data.description,
                media: body.data.media,
                remarks: body.data.remarks,
                Tags: body.data.tags

            }
        });
        const domainManagerData = await strapi.entityService.findMany('api::domain-manager.domain-manager', {
            populate: '*',
            filters: {url: entry[0].url}
        })

        if(domainManagerData.length > 0){

            let updatedGemData = {
    
                ...updatedGem,
                domainName: domainManagerData[0].domainName,
                medium: domainManagerData[0].medium,
                canonical: domainManagerData[0].canonical,
                Extras: domainManagerData[0].Extras
            }
            return updatedGemData;
        } else {
            let  updatedGemData = {
                ...updatedGem
            }
            return updatedGemData;

        }
    }
}));
