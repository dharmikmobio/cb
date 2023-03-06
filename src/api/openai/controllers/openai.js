'use strict';

/**
 * openai controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::openai.openai', ({strapi}) => ({
    openai: async (ctx) => {
        try {
            const body = ctx.request.body;

            const data = await strapi.service('api::openai.openai').openai(body);

            ctx.send(data);

        } catch (error) {
            ctx.send({status: 400, message: error});
        }
    }
}));
