'use strict';

/**
 * third-party-token controller
 */
const request                           = require('request');
const axios                             = require('axios')
const { RAINDROP_CLIENT_ID,
        RAINDROP_CLIENT_SECRET,
        RAINDROP_REDIRECT_URI 
      }                                = process.env
const { createCoreController }         = require('@strapi/strapi').factories;

const awaitRequest = (options) => {
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) {
                console.log(error, response, body)
                reject(error);
            }
            resolve(body);
        });
    });
};

module.exports = createCoreController('api::third-party-token.third-party-token', ({ strapi }) => ({ 
    setRaindropToken: async (ctx) => {
        const queryParams   = ctx.request.url.split("?code=")
        const code          = queryParams.length > 1 ? queryParams[1] : ""
        console.log("API Called!", code)
        if (code !== "") {
            const raindropToken = await axios({
                url: "https://raindrop.io/oauth/access_token",
                method: "post",
                data: {
                    client_id: RAINDROP_CLIENT_ID,
                    client_secret: RAINDROP_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: RAINDROP_REDIRECT_URI
                }
            })
    
            await strapi.entityService.create('api::third-party-token.third-party-token', {
                data: {
                  provider: "Raindrop",
                  token: raindropToken.data.access_token,
                  token_type: raindropToken.data.token_type,
                  refresh_token: raindropToken.data.refresh_token,
                  is_active: true,
                  publishedAt: new Date().toISOString()
                },
            });
    
            ctx.send({
                provider: "Raindrop",
                token: raindropToken.data.access_token,
                token_type: raindropToken.data.token_type,
                refresh_token: raindropToken.data.refresh_token,
                is_active: true
            })
            return
        }
        ctx.send({})
    }
}));
