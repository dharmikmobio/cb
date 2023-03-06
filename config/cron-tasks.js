// require("dotenv").config()

// const awaitRequest               = require("../utils")
const request = require('request');
const axios   = require('axios')
const { RAINDROP_CLIENT_ID,
        RAINDROP_CLIENT_SECRET,
        RAINDROP_REDIRECT_URI 
      }                             = process.env

const awaitRequest = (options) => {
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) reject(error);
            resolve(body);
        });
    });
};

module.exports = {
    /**
     * Simple example.
     * Every monday at 1am.
     */

    // Raindrop access token refresh Cron for after every two weeks
    '0 0 1,15 * * *': async ({ strapi }) => {
    // '* * * * * *': async ({ strapi }) => {
      // Add your own logic here (e.g. send a queue of email, create a database backup, etc.).
      console.log("Cron Started For Updating Refresh Token!")
      const activeTokens  = await strapi.entityService.findMany("api::third-party-token.third-party-token", { filters: { provider: "Raindrop", is_active: true } })
      const activeToken   = activeTokens ? activeTokens[0] : null
      if (!activeToken) {
        // console.log("URL ==>", `https://api.raindrop.io/v1/oauth/authorize?client_id=${RAINDROP_CLIENT_ID}&redirect_uri=${RAINDROP_REDIRECT_URI}`)
        await axios.get(`https://api.raindrop.io/v1/oauth/authorize?client_id=${RAINDROP_CLIENT_ID}&redirect_uri=${RAINDROP_REDIRECT_URI}`, 
          {
            headers: { "Accept-Encoding": "gzip,deflate,compress" }
          }
        )
        return
      }
      console.log("Refreshing the token")
      await strapi.entityService.update("api::third-party-token.third-party-token", activeToken.id, {
        data: {
            is_active: false
        }
      })
      const raindropToken = await axios({
        url: "https://raindrop.io/oauth/access_token",
        method: "post",
        data: {
            client_id: RAINDROP_CLIENT_ID,
            client_secret: RAINDROP_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: activeToken.refresh_token
        }
      })
      console.log("Token Generating!")
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
    },
};