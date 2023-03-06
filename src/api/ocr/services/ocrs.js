'use strict';

/**
 * domain-details service
 */
module.exports = () => ({
    getImageToText: (url) => {
        console.log("URL")
    },

    getImageOcr: async (params, userId) => {
        try {

            let queryURL;
            params.map(data => queryURL = data.value.endsWith('/') ? data.value.slice(0, -1) : data.value);

            const imageOcrData = await strapi.entityService.findMany('api::gem.gem', {
                filters: { url: queryURL, author: userId, media_type: "Image" }
            });

            let result = imageOcrData.map(({ id, media }) => ({ id, media })).flat(Infinity);

            return result;
        } catch (error) {
            console.log(error);
        }
    },

    getImageOcrById: async (gemId) => {
        try {
            const imageOcrGem = await strapi.entityService.findOne('api::gem.gem', gemId, {
                populate: '*'
            });

            return imageOcrGem
        } catch (error) {
            console.log(error);
        }
    },

    updateImageOcr: async (body, gemId) => {
        try {

            let tagIds = [];
            if (body.tags.length > 0) {
                body.tags.map(data => {
                    tagIds.push(data.id)
                });
            }

            const imageOcrGem = await strapi.entityService.update('api::gem.gem', gemId, {
                data: {
                    media: body,
                    title: body.title,
                    description: body.description,
                    tags: tagIds,
                    collection_gems: body.collections
                }
            });

            return imageOcrGem;
        } catch (error) {
            console.log(error);
        }
    },

    deleteImageOcr: async (gemId) => {
        try {
            const imageOcrGem = await strapi.entityService.delete('api::gem.gem', gemId);

            return imageOcrGem;
        } catch (error) {
            console.log(error);
        }
    },
})