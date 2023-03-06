'use strict';

/**
 * book service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const fetch = require('node-fetch')

module.exports = createCoreService('api::book.book', {

    getBookByName: async (name) => {
        try {

            const books = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${name}&key=AIzaSyBrCuxbqZylwxyVPo3vh7xRVMOIv3CwIJQ`);

            const bookJson = await books.json();

            return bookJson;
        } catch (error) {
            console.log(error);
        }
    },

    createBookGem: async (id, userId, collId) => {
        try {

            const books = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);

            const result = await books.json();

            const booksGem = await strapi.entityService.create("api::gem.gem", {
                data: {
                    title: result.volumeInfo.title,
                    description: result.volumeInfo.description,
                    author: userId,
                    url: result.volumeInfo.previewLink,
                    collection_gems: collId,
                    media_type: "Books",
                    publishedAt: new Date().toISOString(),
                    metaData: result
                }
            });

            const getmovieDomainManager = await strapi.entityService.findMany("api::domain-manager.domain-manager", {
                filters: {url: result.volumeInfo.previewLink}
            });

            if(getmovieDomainManager.length == 0) {

                const movieDomainManager = await strapi.entityService.create("api::domain-manager.domain-manager", {
                    data: {
                        title: result.volumeInfo.title,
                        description: result.volumeInfo.description,
                        author: userId,
                        url: result.volumeInfo.previewLink,
                        gems: booksGem.id,
                        thumbnail: [`${result.volumeInfo.imageLinks.thumbnail}`],
                        publishedAt: new Date().toISOString(),
                        media_type: "Books"
                    }
                });
            };


            return booksGem;
        } catch (error) {
            console.log(error);
        }
    },

    getAllBook: async (userId) => {
        try {
            const books = await strapi.entityService.findMany("api::gem.gem", {
                filters: {author: userId, media_type: "Books"}
            });

            return books;
        } catch (error) {
            console.log(error);
        }
    },

    getBookById: async(gemId) => {
        try {
            console.log("HEllo");
            const bookGem = await strapi.entityService.findOne("api::gem.gem", gemId, {
                populate: '*'
            });

            return bookGem;
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

    deleteBook: async(gemId) => {
        try {
            
            const bookGem = await strapi.entityService.delete("api::gem.gem", gemId);
        
            return bookGem;
        } catch (error) {
            console.log(error);
        }
    }
});
