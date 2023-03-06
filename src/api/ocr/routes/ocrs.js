module.exports = {
    routes: [
      {
       method: 'POST',
       path: '/ocre',
       handler: 'ocrs.getImageToText',
       config: {
         policies: [],
         middlewares: [],
       },
      },
      {
        method: 'GET',
        path: '/ocre',
        handler: 'ocrs.getImageOcr',
      },
      {
        method: 'GET',
        path: '/collections/:collectionId/ocre/:gemId',
        handler: 'ocrs.getImageOcrById',
      },
      {
        method: 'PUT',
        path: '/collections/:collectionId/ocre/:gemId',
        handler: 'ocrs.updateImageOcr',
      },
      {
        method: 'DELETE',
        path: '/collections/:collectionId/ocre/:gemId',
        handler: 'ocrs.deleteImageOcr',
      },
      {
        method: 'POST',
        path: '/imageocr',
        handler: 'ocrs.fileImageToText',
        config: {
          policies: [],
          middlewares: [],
        },
       },
    ],
  };