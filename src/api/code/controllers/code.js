'use strict';

/**
 * code controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { convertRestQueryParams } = require('strapi-utils/lib');

module.exports = createCoreController('api::code.code', ({strapi}) => ({
    createCode: async (ctx, next) => {
        try {
            const body = ctx.request.body;
            const userId = ctx.state.user?.id;
            const data = await strapi.service('api::code.code').createCode(body,userId)

            ctx.send(data)
        } catch (error) {
            ctx.send({status: 400, message: error});
        }
    },

    getCode : async (ctx, next) => {
        try {
            const filter = convertRestQueryParams(ctx.request.query);
            const userId = ctx.state.user.id

            const data = await strapi.service('api::code.code').getCode(filter.where, userId);

            ctx.send(data);
        } catch (error) {
            ctx.send({status: 400, message: error});
        }
    }, 

    getCodeById : async (ctx, next) => {
        try {
            const params = ctx.params;

            const data = await strapi.service('api::code.code').getCodeById(params);

            ctx.send(data);
        } catch (error) {
            ctx.send({status: 400, message: error});
        }
    }, 

    updateCode : async (ctx, next) => {
        try {
            const body = ctx.request.body;
            const params = ctx.params;

            const data = await strapi.service("api::code.code").updateCode(body, params);

            ctx.send(data);
        } catch (error) {
            ctx.send({status: 400, message: error});
        }
    }, 

    deleteCode : async (ctx, next) => {
        try {
            const params = ctx.params;
            await strapi.service("api::code.code").deleteCode(params);

            ctx.send("Code deleted");
        } catch (error) {
            ctx.send({status: 400, message: error});
        }
    } 
}));
