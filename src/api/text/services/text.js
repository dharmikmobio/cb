'use strict';

/**
 * text service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::text.text', ({ strapi }) => ({

    createText: async (body) => {

        let textArr = [];
        body.highlightedData?.map(data => {
            textArr.push(data.highlightedText)
        });

        let textData = textArr.toString();

        const text = await strapi.service("api::gem.gem").create({
            data: {
                title: body.title,
                description: body.description,
                media: body,
                media_type: "Text",
                text: textData,
                remarks: body.remarks
            }
        });

        return text;
    },

    createHighlightedText: async (body, params, userId) => {

        try {

            let tagObj = [];
            body.map(data => {
                if (data.tags && data.tags.length > 0) {
                    tagObj = [...data.tags];
                }
            });

            let tagIds = [];
            tagObj?.map(tag => {
                tagIds.push(tag.id);
            });
            if (body.length !== 0) {
                const highlightedText = await strapi.entityService.create("api::gem.gem", {
                    data: {
                        url: body[0].link || body[0].url,
                        media: body,
                        collection_gems: params.collectionId,
                        author: userId,
                        tags: tagIds,
                        metaData: body[0].metaData || null,
                        media_type: "Highlight Text",
                        publishedAt: new Date().toISOString(),
                    }
                });

                /* logs data for create hightlighed text  */
                await strapi.entityService.create("api::activity-log.activity-log", {
                    data: {
                        action_type: "Highlight Text",
                        action: "create",
                        module: "gem",
                        action_owner: userId,
                        success_msg: "Highlighed text created successfully",
                        new_result: {
                            url: body[0].link,
                            media: body,
                            media_type: "hightlight Text",
                        },
                        gem: highlightedText.id,
                        publishedAt: new Date().toISOString(),
                    },
                });

                return highlightedText;
            }

            return null
        } catch (error) {
            console.log("error", error);
        }
    },

    getHighlightedText: async (params, userId) => {

        try {
            let queryURL
            params.map(data => {
                queryURL = data.value.endsWith('/') ? data.value.slice(0, -1) : data.value;
            });

            const highlightData = await strapi.entityService.findMany("api::gem.gem", {
                populate: "*",
                filters: { url: queryURL, media_type: "Highlight Text", author: userId }
            });

            let result = highlightData.map(({ id, media }) => ({ id, media })).flat(Infinity);

            return result;

        } catch (error) {
            return error;
        }

    },

    getHighlightedTextById: async (body, params, userId) => {

        try {
            const highlightGem = await strapi.entityService.findOne("api::gem.gem", params.highlightId, {
                populate: '*'
            });

            const highlightTag = highlightGem.tags.map(({ id, tag }) => ({ id, tag }));
            const collectionData = highlightGem.collection_gems;
            let mediaData = highlightGem.media;

            let objIndex = mediaData.findIndex((obj => obj._id === params.uuid));
            if (objIndex === -1) throw "Invalid Id";

            let highlightedText = mediaData[objIndex];

            return { highlightedText, collectionData, highlightTag };

        } catch (error) {
            console.log("error", error);
            return error
        }
    },

    updateHighlightedText: async (body, params, userId) => {

        try {
            const highlightGem = await strapi.entityService.findOne("api::gem.gem", params.highlightId);

            let mediaData = highlightGem.media;

            let isAvailable = false;
            if (mediaData._id === body._id) {
                isAvailable = true
            }

            if (params.uuid === undefined && isAvailable === false) {
                mediaData = [...mediaData, body];
            } else {
                let objIndex = mediaData.findIndex((obj => obj._id === params.uuid));
                mediaData[objIndex] = body;
            }

            let tagsArr = [];
            mediaData.map(data => {
                if (data.tags != undefined) {
                    tagsArr.push(data.tags);
                }
            })
            tagsArr = tagsArr.flat(Infinity);

            let tagIds = [];
            if (tagsArr.length > 0) {
                tagsArr.map(data => {  
                    tagIds.push(data.id)
                });
            }

            const dataObj = {
                media: mediaData,
                collection_gems: body.collections,
                tags: tagIds
            }

            if (body.metaData) {
                dataObj["metaData"] = { ...highlightGem.metaData, ...body.metaData }
            }
            const highlightedText = await strapi.entityService.update("api::gem.gem", params.highlightId, {
                data: dataObj
            });

            /* logs data for update hightlighed text  */
            await strapi.entityService.create("api::activity-log.activity-log", {
                data: {
                    action_type: "Highlight Text",
                    action: "update",
                    action_owner: userId,
                    module: "gem",
                    success_msg: "Highlighed text updated successfully",
                    new_result: { media: mediaData },
                    old_result: {
                        url: highlightGem.url,
                        media: highlightGem.media,
                        media_type: highlightGem.media_type,
                    },
                    gem: highlightedText.id,
                    publishedAt: new Date().toISOString(),
                },
            });

            return highlightedText;

        } catch (error) {
            console.log("error", error);
        }
    },

    deleteHighlightedText: async (params, userId) => {

        try {
            
            const highlightGem = await strapi.entityService.findOne("api::gem.gem", params.highlightId);

            let mediaData = highlightGem.media;
            let highlightData = mediaData.filter((data) => data._id !== params.uuid);

            let result = highlightData.map(({ tags }) => tags);
            let tagsArr = result.flat(Infinity);
            let tagIds = tagsArr.map(({ id }) => id);

            const highlightedText = await strapi.entityService.update("api::gem.gem", params.highlightId, {
                data: {
                    media: highlightData,
                    tags: tagIds
                }
            });

            /* logs data for Remove Highlighed Text from media Object */
            await strapi.entityService.create("api::activity-log.activity-log", {
                data: {
                    action_type: "Highlight Text",
                    action: "delete",
                    module: "gem",
                    action_owner: userId,
                    success_msg: "Highlighed text deleted successfully",
                    old_result: highlightGem,
                    publishedAt: new Date().toISOString(),
                },
            });

            return highlightedText;

        } catch (error) {
            console.log("error", error);
        }
    },

}));
