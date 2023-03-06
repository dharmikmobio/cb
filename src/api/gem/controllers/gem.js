'use strict';

const { convertRestQueryParams } = require('strapi-utils/lib');

/**
 * gem controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::gem.gem', ({strapi}) => ({

  async uploadScreenshot (ctx) {
    try {
      if (!ctx.request.files) {
        return ctx.send({ msg: "No file exists" }, 400);
      }
      const { files } = ctx.request.files;

      const filesSelect =
        files?.length && files.length > 0 ? "mutiple" : "single";

      if (filesSelect === "single" && (!files?.name || !files?.size)) {
        return ctx.send({ msg: "No file exists" }, 400);
      }

      const covers = await Promise.all(strapi.service("api::gem.gem").updateBookmarkMedia(files));
      ctx.send(covers);
    } catch (error) {
      console.log("error occured :", error);
    }
  },

  async updateCoverImage (ctx) {
    const { gemId } = ctx.params
    try {
      if (!ctx.request.files) {
        return ctx.send({ msg: "No file exists" }, 400);
      }
      const { files } = ctx.request.files;

      const filesSelect =
        files?.length && files.length > 0 ? "mutiple" : "single";

      if (filesSelect === "single" && (!files?.name || !files?.size)) {
        return ctx.send({ msg: "No file exists" }, 400);
      }

      const covers = await Promise.all(strapi.service("api::gem.gem").updateBookmarkMedia(files));
      const gem    = await strapi.entityService.findOne("api::gem.gem", parseInt(gemId));
      const uGem   = await strapi.entityService.update("api::gem.gem", parseInt(gemId), {
        data: {
          media: {
            ...gem.media,
            covers: gem.media.covers ? [ ...gem.media.covers, ...covers ] : covers
          }
        }
      })
      ctx.send(uGem);
    } catch (error) {
      console.log("error occured :", error);
    }
  },

  async moveGems (ctx) {
    const { gemId, destinationCollId } = ctx.params
    const gem = await strapi.entityService.update("api::gem.gem", gemId, {
      data: {
        collection_gem: destinationCollId
      }
    })

    // Adding gem in the desitination
    await strapi.entityService.update("api::collection.collection", destinationCollId, {
      data: {
        gems: [ gemId ]
      }
    })
    
    ctx.send(gem)
  },

  async importGem(ctx) {
    const { data }     = ctx.request.body
    const { user }     = ctx.state

    if (data && user) {
      try {
        const promiseArr = data.map(a => {
          return this.addGemWithPromise(a, user.id)
        });
        const response = await Promise.all(promiseArr);
        console.log("Promise Arr", response)
        ctx.send(response)
      } catch (error) {
        ctx.send(error)
      }
    }
    else {
      ctx.send("Data or user invalid")
    }
  },

  addGemWithPromise (o, author) {
    return new Promise((resolve, reject) => {
      strapi
      .service("api::gem.gem")
      .create({
        data: {
          ...o,
          author: author,
          title: o.title,
          media_type: "Link",
          url: o.url,
          tags: o.tags.map((t) => { return t.id }),
          collection_gems: o.collection_gems,
          publishedAt: new Date().toISOString(),
        }
      }).then((res) => {
        resolve({
          id: res.id,
          url: res.url,
          title: res.title,
          remarks: res.remarks,
          metaData: res.metaData,
          media: res.media,
          description: res.description,
          media_type: res.media_type,
          S3_link: res.S3_link,
          is_favourite: res.is_favourite,
          collection_gems: res.collection_gems,
          tags: o.tags
        })
      }).catch((err) => {
        console.log(err)
      })
    })
  },

  async createGem(data, author) {
    const gem = await strapi
      .service("api::gem.gem")
      .create({
        data: {
          ...data,
          author: author,
          name: data.title,
          media_type: "Link",
          metaData: {
            ...data,
          },
          publishedAt: new Date().toISOString(),
        }
      })
    return gem;
  },
    
  updateGem: async (ctx, next) => {
    try {
      const filter = convertRestQueryParams(ctx.request.params);
      const URL = filter.where;
      const Body = ctx.request.body
      const data = await strapi.service('api::gem.gem').updateGem(URL, Body)

      ctx.send(data)
    } catch (error) {
      console.log("error",error);
    }
  },

  getAllHighlights: async (ctx) => {
    const { user }        = ctx.state 
    const filter          = convertRestQueryParams(ctx.request.query);
    const queryParamArr   = filter.where
    if (queryParamArr.length === 0) {
      ctx.send("URL not passed.")
      return
    }

    if (!user) {
      ctx.send("You are not authorized to perform this action.")
      return
    }

    const url             = queryParamArr[0].value
    const gems            = await strapi.entityService.findMany('api::gem.gem', {
      filters: {
        url,
        author: user.id,
        media_type: { $in: [ "Highlight Text", "Code", "Image" ] }
      },
      fields: ["id", "media", "title", "description", "S3_link", "metaData", "is_favourite", "remarks", "media_type"],
      populate: {
        tags: {
          fields: ["id", "tag"]
        },
        collection_gems: {
          fields: ["id", "name"]
        }
      },
    });

    ctx.send(gems)
  }
      
}));
