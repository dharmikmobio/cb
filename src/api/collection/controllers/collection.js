'use strict';

/**
 * collection controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
// const { parseMultipartData } = require('@strapi/utils');
const { parse } = require('tldts');
const path = require('path')
const moment = require("moment")
const fs = require('fs')
const { awaitRequest } = require("../../../../utils")
// const request = require('request');



module.exports = createCoreController('api::collection.collection', ({ strapi }) => ({

  async moveToRootCollections (ctx) {
    const { sourceCollectionId } = ctx.params

    const collection  = await strapi.entityService.update("api::collection.collection", sourceCollectionId, {
      data: {
        collection: null,
        is_sub_collection: false
      }
    })

    ctx.send(collection)
    
  },

  async moveCollections (ctx) {
    const { sourceCollectionId, destinationCollectionId } = ctx.params

    // Remove and update collection from the source to destination
    const collections = await strapi.db.query("api::collection.collection").findMany({
      where: {
        id: {
          $in: [ sourceCollectionId, destinationCollectionId ]
        }
      },
      populate: {
        collection: true
      }
    })
    const srcIdx      = collections.findIndex((f) => { return f.id === parseInt(sourceCollectionId) })
    const destIdx     = collections.findIndex((f) => { return f.id === parseInt(destinationCollectionId) })
    const source      = srcIdx !== -1 ? collections[srcIdx] : null
    const destination = destIdx !== -1 ? collections[destIdx] : null
    
    if (source && destination && destination.collection && destination.collection.id === source.id) {
      await strapi.entityService.update("api::collection.collection", destinationCollectionId, {
        data: {
          collection: null,
          is_sub_collection: false
        }
      })
    }

    const collection  = await strapi.entityService.update("api::collection.collection", sourceCollectionId, {
      data: {
        collection: destinationCollectionId,
        is_sub_collection: true
      }
    })

    ctx.send(collection)
    
  },

  createBookmarkCollection (collections, author, collection=null) {
    const arr = []
    collections.forEach((c) => {
      const finalCollection = {
        ...c,
        name: c.title,
        author: author?.id,
        publishedAt: new Date().toISOString(),
        is_sub_collection: collection !== null,
        collection: collection ? { id: collection.id, name: collection.name } : null
      };

      arr.push(new Promise((resolve, reject) => {
        strapi.service("api::collection.collection").create({ data: finalCollection })
              .then(async (collection) => {
                if (c.folders.length !== 0) {
                  const subfolders        = this.createBookmarkCollection(c.folders, author, collection)
                  finalCollection.folders = await Promise.all(subfolders)
                  
                }
                if (c.bookmarks.length !== 0) {
                  const bookmarks = []
                  c.bookmarks.forEach((b) => {
                    bookmarks.push(this.createBookmarkGem(b, author, collection.id))
                  })
                  finalCollection.bookmarks = await Promise.all(bookmarks)
                }
                resolve({ ...finalCollection, ...collection })
              })
      }))
    })
    return arr
  },

  createBookmarkWithIcon (b, author, parentId, resolve) {
    return strapi
    .service("api::gem.gem")
    .create({
      data: {
        ...b,
        url: b.link,
        author: author,
        name: b.title,
        media_type: "Link",
        media: b.icon ? { covers: [b.icon] } : {},
        tags: [],
        metaData: {
          ...b,
        },
        collection_gems: parentId,
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
        tags: []
      })
    })
  },

  createBookmarkGem (b, author, parentId) {
    return new Promise((resolve, reject) => {
      if (b.icon && b.icon.startsWith("data:")) {
        const urlParse  = parse(b.link)
        const parseArr  = urlParse && urlParse.domain ? urlParse.domain.split(".") : []
        const filename  = parseArr.length !== 0 ? parseArr[0] : b.title.slice(0, 3)
        strapi.service("api::gem.gem")
              .uploadImageFromBase64(b.icon, `common/images/bookmark_images/bookmark-${filename}-${moment().toDate().getTime()}.jpg`)
              .then((path) => {
                b.icon = path
                this.createBookmarkWithIcon(b, author, parentId, resolve)
              })
      }
      else {
        this.createBookmarkWithIcon(b, author, parentId, resolve)
      }
      
    })
  },

  async importCollection(ctx) {
    const author              = ctx.state.user;
    const { body }            = ctx.request;
    if (body) {
      const mainArr = this.createBookmarkCollection(body, author)
      const data    = await Promise.all(mainArr)
      ctx.send(data);
    }
    else {
      ctx.send({ msg: "Collection data not passed."});
    }
  },

  async importCollectionRaindrop(ctx) {
    const files = ctx.request.files;
    const author = ctx.state.user
    if (ctx.is('multipart')) {
      const file = files.files;      
      const absolutePath = path.join(file.path);

      try {
        const raindropTokens = await strapi.entityService.findMany('api::third-party-token.third-party-token', {
          filters: {
            provider: "Raindrop",
            is_active: true
          },
        });
        console.log("Token Fetched")
        if (raindropTokens && raindropTokens.length === 1) {
          const raindropToken = raindropTokens[0]
          console.log("Ready for raindrop api")
          const bookmarks = await awaitRequest({
            method: "post",
            url: "https://api.raindrop.io/rest/v1/import/file",
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `${raindropToken.token_type} ${raindropToken.token}`
            },
            formData: {
              import: {
                value: fs.createReadStream(absolutePath),
                options: {
                  filename: file.name,
                  contentType: 'text/html'
                }
              }
            }
          })
          console.log("Bookmarked Fetched!")
          const mainArr = this.createBookmarkCollection(JSON.parse(bookmarks).items, author)
          const data    = await Promise.all(mainArr)
          console.log("Sending the response")
          // return data
          ctx.send(data)
        }
        else {
          ctx.send([])
        }
      } catch (error) {
        ctx.send(error)
      }
    }
    else {
      ctx.send({ "msg":  "File not available" })
    }
  },

  prepareSubfolders(collections, parent) {
    const arr            = []
    const filteredArr    = collections.filter((c) => { return c.collection !== null && c.collection.id === parent.id })
    if (filteredArr.length !== 0) {
      filteredArr.forEach((s) => {
        if (s.collection.id === parent.id) {
          const obj = {
            ...s,
            folders: this.prepareSubfolders(collections, s),
            bookmarks: s.gems || []
          }
          delete obj.gems
          arr.push(obj)
        }
      })
    }
    return arr
  },

  prepareCollectionData(collections) {
    const arr               = []
    collections.filter((c) => { return c.collection === null }).forEach((p) => {
      const obj = { 
        ...p, 
        folders: this.prepareSubfolders(collections, p),
        bookmarks: p.gems || []
      }
      delete obj.gems
      arr.push(obj)
    })
    return arr
  },

  async getUserCollections (ctx) {
    const { user } = ctx.state
    if (user) {
      const collections = await strapi.entityService.findMany('api::collection.collection', {
        filters: {
          author: user.id
        },
        sort: { id: 'asc' },
        fields: ["id", "name"]
      })
      ctx.send(collections)
    }
    else {
      ctx.send([])
    }
  },

  async getUserBookmarkCollections(ctx) {
    const { user } = ctx.state
    if (user) {
      const collections = await strapi.entityService.findMany('api::collection.collection', {
        filters: {
          author: user.id
        },
        sort: { id: 'asc' },
        populate: {
          collection: {
            fields: ["id", "name"]
          },
          gems: {
            fields: ["id", "url", "title", "remarks", "metaData", "media", "description", "media_type", "S3_link", "is_favourite"],
            populate: {
              tags: {
                fields: ["id", "tag"]
              }
            }
          }
        }
      });
      const finalCollections = this.prepareCollectionData(collections)
      const finalResult      = finalCollections.filter((f) => { return f.collection === null })
      ctx.send(finalResult)
    }
    else {
      ctx.send([])
    }
  }
}));