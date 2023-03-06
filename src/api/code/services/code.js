'use strict';

/**
 * code service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::code.code', ({ strapi }) => ({

  createCode: async (body, userId) => {

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

    const code = await strapi.entityService.create("api::gem.gem", {
      data: {
        url: body[0].url || body[0].url,
        media: body,
        collection_gems: body[0].collections,
        author: userId,
        tags: tagIds,
        media_type: "Code",
        metaData: body[0].metaData || null,
        title: body[0].title,
        description: body[0].description,
      }
    })
    
    /* logs data for createCode in gem  */
    if (userId) {
      await strapi.entityService.create("api::activity-log.activity-log", {
        data: {
          action_type: "Create code",
          action: "create",
          module: "gem",
          action_owner: userId,
          success_msg: "Code created successfully",
          new_result: {
            media_type: "Code",
            media: body.data,
          },
          gem: code.id,
          publishedAt: new Date().toISOString(),
        },
      });
    }

    return code;
  },

  getCode: async (params, userId) => {
    try {
      let queryURL;
      params.map(data => {
        queryURL = data.value.endsWith('/') ? data.value.slice(0, -1) : data.value;
      });
      
      const codeData = await strapi.entityService.findMany('api::gem.gem', {
        filters: { url: queryURL, media_type: "Code", author: userId }
      });

      let result = codeData.map(({ id, media }) => ({ id, media })).flat(Infinity);

      return result;

    } catch (error) {
      return error;
    }
  },

  getCodeById: async (params) => {
    try {
      const codeGem = await strapi.entityService.findOne('api::gem.gem', params.gemId, {
        populate: "*"
      });

      const codeTag = codeGem.tags.map(({ id, tag }) => ({ id, tag }));
      const collectionData = codeGem.collection_gems;
      const mediaData = codeGem.media;
      let objIndex = mediaData.findIndex((obj => obj._id === params.uuid));
      if (objIndex === -1) throw "Invalid Id";

      const codeData = mediaData[objIndex];

      return { codeData, collectionData, codeTag };
    } catch (error) {
      return error
    }
  },

  updateCode: async (body, params) => {
    try {
      const codeGem = await strapi.entityService.findOne('api::gem.gem', params.gemId)

      let mediaData = codeGem.media;

      let isAvailable = false;
      if (mediaData._id === body._id) {
        isAvailable = true;
      }

      if (params.uuid === undefined && isAvailable === false) {
        mediaData = [...mediaData, body];
      } else {
        const objIndex = mediaData.findIndex((obj => obj._id === params.uuid));
        mediaData[objIndex] = body;
      }

      let tagsArr = [];
      if (mediaData.tags != undefined) {
        tagsArr.push(mediaData.tags);
      }

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
        dataObj["metaData"] = { ...codeGem.metaData, ...body.metaData }
      }
      const codeData = await strapi.entityService.update('api::gem.gem', params.gemId, {
        data: dataObj
      });

      return codeData;
    } catch (error) {
      return error;
    }
  },

  deleteCode: async (params) => {
    try {

      const codeGem = await strapi.entityService.findOne("api::gem.gem", params.gemId);

      let mediaData = codeGem.media;
      let codeData = mediaData.filter((data) => data._id !== params.uuid);

      let tagsArr = [];
      if (mediaData.tags != undefined) {
        tagsArr.push(mediaData.tags);
      }

      let tagIds = [];
      if (tagsArr.length > 0) {
        tagsArr.map(data => {
          tagIds.push(data.id)
        });
      }

      const codeText = await strapi.entityService.update("api::gem.gem", params.gemId, {
        data: {
          media: codeData,
          tags: tagIds
        }
      });
     
      return codeText;
    } catch (error) {
      return error;
    }
  },

}));
