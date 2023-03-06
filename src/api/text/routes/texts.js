module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/text',
            handler: 'text.createText',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        { 
            method: 'POST',
            path: '/collections/:collectionId/highlights',
            handler: 'text.createHighlightedText',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/highlights',
            handler: 'text.getHighlightedText',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/collections/:collectionId/highlights/:highlightId/:uuid',
            handler: 'text.getHighlightedTextById',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/collections/:collectionId/highlights/:highlightId',
            handler: 'text.updateHighlightedText',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/collections/:collectionId/highlights/:highlightId/:uuid',
            handler: 'text.updateHighlightedText',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/collections/:collectionId/highlights/:highlightId/:uuid',
            handler: 'text.deleteHighlightedText',
            config: {
                policies: [],
                middlewares: [],
            },
        }
    ]
}