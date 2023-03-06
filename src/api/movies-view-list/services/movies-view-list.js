'use strict';

/**
 * movies-view-list service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const axios = require("axios");

module.exports = createCoreService('api::movies-view-list.movies-view-list', {

    searchByMovieName: async (name) => {
        try {

            const options = {
                method: 'GET',
                url: 'https://mdblist.p.rapidapi.com/',
                params: { s: name },
                headers: {
                    'X-RapidAPI-Key': '43efd59272msh7b67a90b354d3e5p161ba5jsnd695f63c0958',
                    'X-RapidAPI-Host': 'mdblist.p.rapidapi.com'
                }
            };

            let imdbId;

            await axios.request(options).then(function (response) {
                imdbId = response.data.search;
                console.log(response.data);
            }).catch(function (error) {
                console.error(error);
            });

            return imdbId;
        } catch (error) {
            console.log(error);
        }
    },

    createMovieGem: async (id, userId, collId) => {
        try {

            const options = {
                method: 'GET',
                url: 'https://mdblist.p.rapidapi.com/',
                params: { i: id },
                headers: {
                    'X-RapidAPI-Key': '43efd59272msh7b67a90b354d3e5p161ba5jsnd695f63c0958',
                    'X-RapidAPI-Host': 'mdblist.p.rapidapi.com'
                }
            };

            let result;

            await axios.request(options).then(function (response) {
                result = response.data;
            }).catch(function (error) {
                console.error("error", error);
            });

            const rating = result.ratings[0].value;
            let keywords = []
            result.keywords.map(data => keywords.push(data.name));

            const moviesGem = await strapi.entityService.create("api::gem.gem", {
                data: {
                    title: result.title,
                    description: result.description,
                    author: userId,
                    url: `https://www.imdb.com/title/${id}`,
                    collection_gems: collId,
                    media_type: "Movies",
                    moviesObj: result,
                    publishedAt: new Date().toISOString(),
                    ratings: rating
                }
            });

            const getmovieDomainManager = await strapi.entityService.findMany("api::domain-manager.domain-manager", {
                filters: { url: `https://www.imdb.com/title/${id}` }
            });

            if (getmovieDomainManager.length == 0) {

                const movieDomainManager = await strapi.entityService.create("api::domain-manager.domain-manager", {
                    data: {
                        title: result.title,
                        description: result.description,
                        url: `https://www.imdb.com/title/${id}`,
                        gems: moviesGem.id,
                        thumbnail: [`${result.poster}`],
                        publishedAt: new Date().toISOString(),
                        TagsData: keywords,
                        media_type: "Movies"
                    }
                });

            }
            return moviesGem;
        } catch (error) {
            console.log(error);
        }
    },

    getAllMovie: async (userId) => {
        try {
            const books = await strapi.entityService.findMany("api::gem.gem", {
                filters: { author: userId, media_type: "Movies" }
            });

            return books;
        } catch (error) {
            console.log(error);
        }
    },

    getMovieByGemId: async (gemId) => {
        try {

            const moviesGem = await strapi.entityService.findOne("api::gem.gem", gemId, {
                populate: '*'
            });

            return moviesGem;
        } catch (error) {
            console.log(error);
        }
    },

    updateMovie: async (body, gemId) => {
        try {

            const pdfOcrGem = await strapi.entityService.update('api::gem.gem', gemId, {
                data: {
                    
                }
            });

            return pdfOcrGem;
        } catch (error) {
            console.log(error);
        }
    },

    deleteMovieGem: async (gemId) => {
        try {

            const moviesGem = await strapi.entityService.delete("api::gem.gem", gemId);

            return moviesGem;
        } catch (error) {
            console.log(error);
        }
    }
});
