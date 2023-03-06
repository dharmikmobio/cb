module.exports = {
    routes : [
        {
            method: 'POST',
            path: '/upload',
            handler: 'upload-file.uploadFile',
            config: {
              policies: [],
              middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/uploadfile',
            handler: 'upload-file.uploadFileWithBuffer',
            config: {
              policies: [],
              middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/files',
            handler: 'upload-file.deleteFile',
            config: {
                policies: [],
                middlewares: [],
            },
        }
    ]
}

