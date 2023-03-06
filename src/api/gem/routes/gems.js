module.exports = {
    routes: [
        {
        method: 'PUT',
        path: '/gem/:id',
        handler: 'gem.updateGem',
        config: {
            policies: [],
            middlewares: [],
          },
        },
        { // Path defined with an URL parameter
            method: 'POST',
            path: '/gems/:gemId/move/:sourceCollId/:destinationCollId',
            handler: 'gem.moveGems',
        },
        { // Path defined with an URL parameter
            method: 'PUT',
            path: '/gems/:gemId/upload-bookmark-cover',
            handler: 'gem.updateCoverImage',
        },
        {
            method: 'POST',
            path: '/gems/upload-screenshot',
            handler: 'gem.uploadScreenshot'
        }
    ]
}
