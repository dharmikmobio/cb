"use strict";

/**
 * upload-file controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::upload-file.upload-file",
  ({ strapi }) => ({
    uploadFile: async (ctx, next) => {
      try {
        if (!ctx.request.files) {
          return ctx.send({ msg: "No file exists" }, 400);
        }
        const { files } = ctx.request.files;
        const query = ctx.request.query;

        const filesSelect =
          files?.length && files.length > 0 ? "mutiple" : "single";

        if (filesSelect === "single" && (!files?.name || !files?.size)) {
          return ctx.send({ msg: "No file exists" }, 400);
        }

        const data = await strapi
          .service("api::upload-file.upload-file")
          .uploadFile(files, query);

        ctx.send(data);
      } catch (error) {
        console.log("error occured :", error);
      }
    },

    uploadFileWithBuffer: async (ctx, next) => {
      try {
        const buffer = ctx.request.body.base64;
        const query = ctx.request.query;
        
        const data = await strapi
          .service("api::upload-file.upload-file")
          .uploadFileWithBuffer(buffer, query);

        ctx.send({ status: 200, message: data });
        
      } catch (error) {
        return { status: 400, message: error };
      }
    },

    deleteFile: async (ctx) => {
      try {
        const path = ctx.request.query.path;

        const data = await strapi
          .service("api::upload-file.upload-file")
          .deleteFile(path);

        ctx.send({ status: 200, message: "File is deleted" });

      } catch (error) {
        return { status: 400, message: error };
      }
    }
  })
);
