'use strict';

/**
 * pdf-to-text router
 */

module.exports = {
    routes: [
        {
         method: 'POST',
         path: '/pdf',
         handler: 'pdf-text.getPdfToText',
         config: {
           policies: [],
           middlewares: [],
         },
        },
        {
          method: 'POST',
          path: '/pdfstore',
          handler: 'pdf-text.pdfStore',
        },
        {
          method: 'POST',
          path: '/highlightpdf',
          handler: 'pdf-text.createHighlightPdf',
        },
        {
          method: 'GET',
          path: '/highlightpdf',
          handler: 'pdf-text.getPdfHighlight',
        },
        {
          method: 'GET',
          path: '/collections/:collectionId/highlightpdf/:gemId',
          handler: 'pdf-text.getPdfHighlightById',
        },
        {
          method: 'PUT',
          path: '/collections/:collectionId/highlightpdf/:gemId',
          handler: 'pdf-text.updatePdfHighlight',
        },
        {
          method: 'DELETE',
          path: '/collections/:collectionId/highlightpdf/:gemId',
          handler: 'pdf-text.deletePdfHighlight',
        },


        {
          method: 'GET',
          path: '/pdftext',
          handler: 'pdf-text.linkPdfToText',
          config: {
            policies: [],
            middlewares: [],
          },
         },
      ],
}