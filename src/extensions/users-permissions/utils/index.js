'use strict';
const getService = name => {
    return strapi.plugin('users-permissions').service(name);
};
const getProfile = async (provider, query) => {
    const accessToken = query.access_token || query.code || query.oauth_token;

    const providers = await strapi
      .store({ type: 'plugin', name: 'users-permissions', key: 'grant' })
      .get();

    return getService('providers-registry').run({
      provider,
      query,
      accessToken,
      providers,
    });
};
module.exports = {
    getService,
    getProfile
};