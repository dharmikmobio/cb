'use strict';

/**
 * prompt-builder controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::prompt-builder.prompt-builder', ({strapi}) => ({
    createPromptGem: async (ctx, next) => {
        try {
            const body = ctx.request.body;
            const user = ctx.state.user;
            const data = await strapi.service('api::prompt-builder.prompt-builder').createPromptGem(body, user);

            ctx.send(data);
        } catch (error) {
            ctx.send({status: 400, message: error});
        }
    }
}));
