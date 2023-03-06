"use strict";

/**
 * upload-file service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const path = require("path");
const fs = require("fs");
const { PutObjectCommand, S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { AWS_BUCKET, AWS_ACCESS_KEY_ID, AWS_ACCESS_SECRET, AWS_REGION } =
  process.env;

module.exports = createCoreService(
  "api::upload-file.upload-file",
  ({ strapi }) => ({
    uploadFile: async (files, query) => {
      const filesSelect = files?.length ? "mutiple" : "single";

      let folderPath = 'common/images/bookmark_images';
      if (query.isFeedbackImg === 'true') {
        folderPath = 'common/images/feedback_images';
      } else if (query.isFeedbackDoc === 'true') {
        folderPath = 'common/files/feedback_doc';
      }

      if (filesSelect === "single") {
        const fileObj = files;

        const absolutePath = path.join(fileObj.path);
        const filename = Date.now() + fileObj.name.replace(/ /g, "");
        let fileStream = fs.createReadStream(absolutePath);

        const client = new S3Client({
          region: AWS_REGION,
          credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_ACCESS_SECRET,
          },
        });

        const params = {
          Bucket: AWS_BUCKET,
          Key: `${folderPath}/${filename}`,
          Body: fileStream,
          ContentType: fileObj.type,
          ACL: "public-read",
        };
        await client.send(new PutObjectCommand(params));
        const uploadedfile = await strapi.service("api::gem.gem").create({
          data: {
            media: [
              `${process.env.AWS_BASE_URL}/${folderPath}/${filename}`,
            ],
          },
        });
        return uploadedfile;
      } else {
        const filesPath = [];
        for (const fileObj of files) {
          const absolutePath = path.join(fileObj.path);
          const filename = Date.now() + fileObj.name.replace(/ /g, "");
          let fileStream = fs.createReadStream(absolutePath);

          const client = new S3Client({
            region: AWS_REGION,
            credentials: {
              accessKeyId: AWS_ACCESS_KEY_ID,
              secretAccessKey: AWS_ACCESS_SECRET,
            },
          });

          const params = {
            Bucket: AWS_BUCKET,
            Key: `${folderPath}/${filename}`,
            Body: fileStream,
            ContentType: fileObj.type,
            ACL: "public-read",
          };

          await client.send(new PutObjectCommand(params));
          filesPath.push(
            `${process.env.AWS_BASE_URL}/${folderPath}/${filename}`
          );
        }
        const uploadedfile = await strapi.service("api::gem.gem").create({
          data: {
            media: filesPath,
          },
        });
        return uploadedfile;
      }
    },

    uploadFileWithBuffer: async (buffer, query) => {
      try {
        let folderPath;
        if (query.isScreendhotImg === 'true') {
          folderPath = 'common/images/screenshot_images';
        };

        const base64Data = new Buffer.from(buffer.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = buffer.split(';')[0].split('/')[1];

        const {
          AWS_BUCKET,
          AWS_ACCESS_KEY_ID,
          AWS_ACCESS_SECRET,
          AWS_REGION
        } = process.env;

        const client = new S3Client({
          region: AWS_REGION,
          credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_ACCESS_SECRET
          }
        });

        const filename = 'screenshot' + Date.now()
        const params = {
          Bucket: AWS_BUCKET,
          Key: `${folderPath}/${filename}`,
          Body: base64Data,
          ACL: 'public-read',
          ContentType: `image/${type}`,
        };
        await client.send(new PutObjectCommand(params));

        return [`${process.env.AWS_BASE_URL}/${folderPath}/${filename}`];
      } catch (error) {
        console.log(error);
      }
    },

    deleteFile: async (path) => {
      try {
        const AWS_BASE_URL = 'https://curateit-files.s3.amazonaws.com/';
        const filePath = path.replace(AWS_BASE_URL, '');
        const client = new S3Client({
          region: AWS_REGION,
          credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_ACCESS_SECRET,
          },
        });

        const params = {
          Bucket: AWS_BUCKET,
          Key: filePath,
          ACL: "public-read",
        };

        const data = await client.send(new DeleteObjectCommand(params));
        return data;
      } catch (error) {
        console.log(error);
      }
    }
  })
);
