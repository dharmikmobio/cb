const utils             = require('@strapi/utils');
const { sanitize }      = utils;

const user              = require('./content-types/user');
const { getService,
        getProfile }    = require('../users-permissions/utils');

const sanitizeUser = (userObj, ctx) => {
    const { auth } = ctx.state;
    const userSchema = strapi.getModel('plugin::users-permissions.user');
    return sanitize.contentAPI.output(userObj, userSchema, { auth });
};

module.exports = (plugin) => {    
    const callback = plugin.controllers.auth.callback;

    plugin.controllers.auth.callback = async (ctx) => { 
        const provider      = ctx.params.provider || 'local';

        // If provider local then process as it performing with local
        if (provider === "local") {
            await callback(ctx)
            return
        }

        // If provider is not local need to validate that with the same email user is exists or not
        const profile       = await getProfile(provider, ctx.query)
        if (profile && profile.email) {
            const userObj       = await strapi.query('plugin::users-permissions.user').findOne({
                where: {
                    email: profile.email
                }
            });
            if (userObj) {
                ctx.send({
                    jwt: getService('jwt').issue({
                        id: userObj.id,
                    }),
                    user: await sanitizeUser(userObj, ctx),
                });
                return
            }
        }

        // If user is not exist with this provider email then process as it is for creating the new user
        await callback(ctx)
    }

    plugin.contentTypes.user = user;

    return plugin;
}