'use strict';

const { convertRestQueryParams } = require('strapi-utils');
const path = require('path');
const fs = require('fs');
const axios = require("axios");
const url = require("url");
const { awaitRequest, imageColor, openai } = require('../../../../utils');
const { PutObjectCommand,
    S3Client } = require("@aws-sdk/client-s3");

module.exports = {

    getImageToText: async (ctx, next) => {

        try {
            const userId = ctx.state.user?.id;
            const bodyData = ctx.request.body;
            const filter = convertRestQueryParams(ctx.request.query);
            const { X_RAPIDAPI_KEY,
                AWS_BUCKET,
                AWS_ACCESS_KEY_ID,
                AWS_ACCESS_SECRET,
                AWS_REGION
            } = process.env;

            if (filter.where !== undefined) {

                const res = await axios.get(`https://ocr-extract-text.p.rapidapi.com/ocr?url=${filter.where[0].value}`,
                    {
                        headers: {
                            'X-RapidAPI-Key': X_RAPIDAPI_KEY,
                            'X-RapidAPI-Host': 'ocr-extract-text.p.rapidapi.com',
                            'Accept': 'application/json',
                            'Accept-Encoding': 'identity'
                        }
                    }
                );

                const body = await axios.get(filter.where[0].value, { "responseType": "arraybuffer" })
                let filename
                if (body.error === undefined) {
                    const client = new S3Client({
                        region: AWS_REGION,
                        credentials: {
                            accessKeyId: AWS_ACCESS_KEY_ID,
                            secretAccessKey: AWS_ACCESS_SECRET
                        }
                    });
                    const parsed = url.parse(filter.where[0].value);
                    filename = Date.now() + path.basename(parsed.pathname);
                    let extension = filename.split('.').pop();
                    const params = {
                        Bucket: AWS_BUCKET,
                        Key: `common/images/annotated_images/${filename}`,
                        Body: body.data,
                        ACL: 'public-read',
                        ContentType: `image/${extension}`
                    }
                    await client.send(new PutObjectCommand(params));
                }

                const color = ctx.request.query.imageColor ? await imageColor(`${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`) : null;

                let tagsArr = [];
                if (bodyData.tags != undefined) {
                    tagsArr.push(bodyData.tags);
                }
                tagsArr = tagsArr.flat(Infinity);

                let tagIds = [];
                if (tagsArr.length > 0) {
                    tagsArr.map(data => {
                        tagIds.push(data.id);
                    });
                }

                if (res.data) {

                    if (ctx.request.query.openai) {

                        const promptsData = await strapi.entityService.findMany('api::internal-ai-prompt.internal-ai-prompt', {
                            filters: { promptType: 'Text or Code OCR' }
                        });

                        const words = promptsData[0].inputWords;
                        const textForOpenai = res.data.text.split(/\s+/).slice(0, words).join(" ");
                        const prompt = promptsData[0].prompt.replace(/{text}/g, textForOpenai);

                        const openaiRes = await openai(prompt);

                        let correction = openaiRes.split('Correction: ')[1];

                        const createGemDetails = await strapi.service('api::gem.gem').create({
                            data: {
                                url: bodyData?.url,
                                title: filename,
                                text: correction,
                                S3_link: [`${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`],
                                media_type: "Image",
                                FileName: filename,
                                imageColor: ctx.request.query.imageColor ? color : null,
                                media: bodyData,
                                description: bodyData?.description,
                                author: ctx.state.user?.id,
                                tags: tagIds,
                                collection_gems: bodyData?.collections
                            }
                        });
                        /* logs data for Converting image data to text  */
                        if (userId) {
                            await strapi.entityService.create(
                                "api::activity-log.activity-log",
                                {
                                    data: {
                                        action_type: "Converted image url to text",
                                        action: "create",
                                        module: "gem",
                                        action_owner: userId,
                                        success_msg: "Converted image url to text successfully",
                                        new_result: {
                                            url: filter.where[0].value,
                                            title: filename,
                                            text: correction,
                                            S3_link: [
                                                `${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`,
                                            ],
                                            media_type: "Image",
                                            FileName: filename,
                                        },
                                        gem: createGemDetails.id,
                                        publishedAt: new Date().toISOString(),
                                    },
                                }
                            );
                        }
                        ctx.send(createGemDetails);
                    }
                    else {
                        const createGemDetails = await strapi.service('api::gem.gem').create({
                            data: {
                                url: bodyData?.url,
                                title: filename,
                                text: res.data.text.replace(/\n/g, ''),
                                S3_link: [`${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`],
                                media_type: "Image",
                                FileName: filename,
                                imageColor: ctx.request.query.imageColor ? color : null,
                                media: bodyData,
                                description: bodyData?.description,
                                author: ctx.state.user?.id,
                                tags: tagIds,
                                collection_gems: bodyData?.collections
                            }
                        })
                        /* logs data for Converting image data to text  */
                        if (userId) {
                            await strapi.entityService.create(
                                "api::activity-log.activity-log",
                                {
                                    data: {
                                        action_type: "Converted image url to text",
                                        action: "create",
                                        module: "gem",
                                        action_owner: userId,
                                        success_msg: "Converted image url to text successfully",
                                        new_result: {
                                            url: filter.where[0].value,
                                            title: filename,
                                            text: res.data.text.replace(/\n/g, ""),
                                            S3_link: [
                                                `${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`,
                                            ],
                                            media_type: "Image",
                                            FileName: filename,
                                        },
                                        gem: createGemDetails.id,
                                        publishedAt: new Date().toISOString(),
                                    },
                                }
                            );
                        }
                        ctx.send(createGemDetails);
                    }

                }
                else {
                    console.error(res.error);
                }
            } else if (filter.where === undefined) {
                ctx.send("Please Enter image url");
            }

        } catch (error) {
            console.log("error", error);
            ctx.body = error;
        }
    },

    getImageOcr: async (ctx, next) => {
        try {
            const filter = convertRestQueryParams(ctx.request.query);

            const userId = ctx.state.user.id;

            const data = await strapi.service('api::ocr.ocrs').getImageOcr(filter.where, userId);

            ctx.send(data);
        } catch (error) {
            ctx.send({ status: 400, message: error });
        };
    },

    getImageOcrById: async (ctx, next) => {
        try {
            const params = ctx.params.gemId;

            const data = await strapi.service('api::ocr.ocrs').getImageOcrById(params);

            ctx.send(data);
        } catch (error) {
            ctx.send({ status: 400, message: error });
        };
    },

    updateImageOcr: async (ctx, next) => {
        try {

            const body = ctx.request.body;
            const params = ctx.params.gemId;

            const data = await strapi.service('api::ocr.ocrs').updateImageOcr(body, params);

            ctx.send(data);
        } catch (error) {
            ctx.send({ status: 400, message: error });
        };
    },

    deleteImageOcr: async (ctx, next) => {
        try {
            const params = ctx.params.gemId;

            const data = await strapi.service('api::ocr.ocrs').deleteImageOcr(params);

            ctx.send("Data Deleted");
        } catch (error) {
            ctx.send({ status: 400, message: error });
        };
    },

    fileImageToText: async (ctx, next) => {
        try {
            const userId = ctx.state.user?.id;
            const files = ctx.request.files;
            const { X_RAPIDAPI_KEY,
                AWS_BUCKET,
                AWS_ACCESS_KEY_ID,
                AWS_ACCESS_SECRET,
                AWS_REGION
            } = process.env

            if (ctx.is('multipart')) {
                const file = files.image;
                const filename = Date.now() + file.name.replace(/ /g, '');
                const absolutePath = path.join(file.path);
                const options = {
                    method: 'POST',
                    url: 'https://ocr-extract-text.p.rapidapi.com/ocr',
                    headers: {
                        'content-type': 'multipart/form-data; boundary=---011000010111000001101001',
                        'X-RapidAPI-Key': X_RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'ocr-extract-text.p.rapidapi.com',
                        useQueryString: true
                    },
                    formData: {
                        image: {
                            value: fs.createReadStream(absolutePath),
                            options: { filename: absolutePath, contentType: 'application/octet-stream' }
                        }
                    }
                };

                const ocrResponse = await awaitRequest(options);
                const ocrJSON = JSON.parse(ocrResponse);

                let fileStream = fs.createReadStream(absolutePath);

                const client = new S3Client({
                    region: AWS_REGION,
                    credentials: {
                        accessKeyId: AWS_ACCESS_KEY_ID,
                        secretAccessKey: AWS_ACCESS_SECRET
                    }
                });

                const params = {
                    Bucket: AWS_BUCKET,
                    Key: `common/images/annotated_images/${filename}`,
                    Body: fileStream,
                    ContentType: file.type,
                    ACL: 'public-read'
                }
                await client.send(new PutObjectCommand(params));

                const color = ctx.request.query.imageColor ? await imageColor(`${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`) : null;

                if (ctx.request.query.openai) {
                    const promptsData = await strapi.entityService.findMany('api::internal-ai-prompt.internal-ai-prompt', {
                        filters: { promptType: 'Text or Code OCR' }
                    });

                    const words = promptsData[0].inputWords;
                    const textForOpenai = ocrJSON.text.split(/\s+/).slice(0, words).join(" ");

                    const prompt = promptsData[0].prompt.replace(/{text}/g, textForOpenai);
                    const openaiRes = await openai(prompt);

                    let correction = openaiRes.split('Correction: ')[1];

                    const crateGem = await strapi.service('api::gem.gem').create({
                        data: {
                            title: filename,
                            text: correction,
                            S3_link: [`${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`],
                            media_type: "Image",
                            FileName: filename,
                            imageColor: ctx.request.query.imageColor ? color : null,
                        }
                    });

                    /* logs data for Converting image data to text  */
                    if (userId) {
                        await strapi.entityService.create("api::activity-log.activity-log", {
                            data: {
                                action_type: "Converted image to text",
                                action: "create",
                                module: "gem",
                                action_owner: userId,
                                success_msg: "Converted image to text successfully",
                                new_result: {
                                    title: filename,
                                    text: correction,
                                    S3_link: [
                                        `${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`,
                                    ],
                                    media_type: "Image",
                                    FileName: filename,
                                },
                                gem: crateGem.id,
                                publishedAt: new Date().toISOString(),
                            },
                        });
                    }

                    ctx.send(crateGem);

                } else {
                    const crateGem = await strapi.service('api::gem.gem').create({
                        data: {
                            title: filename,
                            text: ocrJSON.text.replace(/\n/g, ''),
                            S3_link: [`${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`],
                            media_type: "Image",
                            FileName: filename,
                            imageColor: ctx.request.query.imageColor ? color : null,

                        }
                    });

                    /* logs data for Converting image data to text  */
                    if (userId) {
                        await strapi.entityService.create("api::activity-log.activity-log", {
                            data: {
                                action_type: "Converted image to text",
                                action: "create",
                                module: "gem",
                                action_owner: userId,
                                success_msg: "Converted image to text successfully",
                                new_result: {
                                    title: filename,
                                    text: ocrJSON.text.replace(/\n/g, ""),
                                    S3_link: [
                                        `${process.env.AWS_BASE_URL}/common/images/annotated_images/${filename}`,
                                    ],
                                    media_type: "Image",
                                    FileName: filename,
                                },
                                gem: crateGem.id,
                                publishedAt: new Date().toISOString(),
                            },
                        });
                    }
                    ctx.send(crateGem);
                }
            }
        } catch (error) {
            ctx.body = error;
        }

    }
};