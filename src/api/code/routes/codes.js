module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/code',
            handler: 'code.createCode',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/selectedcodes',
            handler: 'code.getCode',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/collections/:collectionId/selectedcodes/:gemId/:uuid',
            handler: 'code.getCodeById',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/collections/:collectionId/selectedcodes/:gemId',
            handler: 'code.updateCode',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/collections/:collectionId/selectedcodes/:gemId/:uuid',
            handler: 'code.updateCode',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/collections/:collectionId/selectedcodes/:gemId/:uuid',
            handler: 'code.deleteCode',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ]
}
