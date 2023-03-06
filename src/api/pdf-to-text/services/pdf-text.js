'use strict';

const { PutObjectCommand,
    S3Client } = require("@aws-sdk/client-s3");
const url = require("url");
const https = require("https");
const path = require('path');
const getPDF = (pdfURL) => {
    return new Promise((resolve, reject) => {
        https.get(pdfURL, (res) => {
            const data = []
            res.on('data', function(chunk) {
                data.push(chunk);
            }).on('end', function() {
                const buffer = Buffer.concat(data);
                resolve(buffer);
            });
        })
    })
}


module.exports = () => ({


    pdfStore: async (queryParams) => {
        try {

            const {
                AWS_BUCKET,
                AWS_ACCESS_KEY_ID,
                AWS_ACCESS_SECRET,
                AWS_REGION
            } = process.env


            const body = await getPDF(queryParams.file)
            let filename
            if (body.error === undefined) {
                const client = new S3Client({
                    region: AWS_REGION,
                    credentials: {
                        accessKeyId: AWS_ACCESS_KEY_ID,
                        secretAccessKey: AWS_ACCESS_SECRET
                    }
                })
                const parsed = url.parse(queryParams.file);
                filename = path.basename(parsed.pathname).replace(/ /g, '')
                const extension = filename.split('.').pop();
                const params = {
                    Bucket: AWS_BUCKET,
                    Key: `common/files/docs/${filename}`,
                    Body: body,
                    ACL: 'public-read',
                    ContentType: `application/${extension}`,
                }
                await client.send(new PutObjectCommand(params))
            }

            return [`${process.env.AWS_BASE_URL}/common/files/docs/${filename}`];
        } catch (error) {
            console.log(error);
        }
    },

    createHighlightPdf: async (body, userId) => {
        try {

            let tagIds = [];
            if (body.tags.length > 0) {
                body.tags.map(data => {
                    tagIds.push(data.id)
                });
            };

            const pdfGem = await strapi.entityService.create("api::gem.gem", {
                data: {
                    title: body.title,
                    collection_gems: body.collections,
                    tags: tagIds,
                    comments: body.comments,
                    url: body.url,
                    media: body,
                    media_type: body.type,
                    text: body.text,
                    author: userId,
                    S3_link: [`${body.s3link}`],
                    publishedAt: new Date().toISOString(),
                }
            });

            return pdfGem;
        } catch (error) {
            console.log(error);
        }
    },

    getPdfHighlight: async (params, userId, type, filterObj) => {
        try {
            let queryURL = params.endsWith('/') ? params.slice(0, -1) : params;

            const pdfOcrData = await strapi.entityService.findMany('api::gem.gem', {
                filters: { 
                    media_type: type,
                    author: userId
                }
            });

            return pdfOcrData.filter((t) => { return t.S3_link && Array.isArray(t.S3_link) && t.S3_link.findIndex((s) => { return s === queryURL }) !== -1 });
           
        } catch (error) {
            console.log(error);
        }
    },

    getPdfHighlightById: async (gemId) => {
        try {
            const pdfOcrGem = await strapi.entityService.findOne('api::gem.gem', gemId, {
                populate: '*'
            });

            return pdfOcrGem
        } catch (error) {
            console.log(error);
        }
    },

    updatePdfHighlight: async (body, gemId) => {
        try {

            let tagIds = [];
            if (body.tags.length > 0) {
                body.tags.map(data => {
                    tagIds.push(data.id)
                });
            }

            const pdfOcrGem = await strapi.entityService.update('api::gem.gem', gemId, {
                data: {
                    media: body,
                    title: body.title,
                    description: body.description,
                    tags: tagIds,
                    collection_gems: body.collections
                }
            });

            return pdfOcrGem;
        } catch (error) {
            console.log(error);
        }
    },

    deletePdfHighlight: async (gemId) => {
        try {
            const pdfOcrGem = await strapi.entityService.delete('api::gem.gem', gemId);

            return pdfOcrGem
        } catch (error) {
            console.log(error);
        }
    },




})