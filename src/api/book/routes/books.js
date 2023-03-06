module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/book-list',
            handler: 'book.getBookByName',
        },
        {
            method: 'POST',
            path: '/collections/:collectionId/bookgems',
            handler: 'book.createBookGem',
        },
        {
            method: 'GET',
            path: '/bookgems',
            handler: 'book.getAllBook',
        },
        {
            method: 'GET',
            path: '/collections/:collectionId/bookgems/:gemId',
            handler: 'book.getBookById',
        },
        {
            method: 'PUT',
            path: '/collections/:collectionId/moviegems/:gemId',
            handler: 'book.updateBook',
        },
        {
            method: 'DELETE',
            path: '/collections/:collectionId/bookgems/:gemId',
            handler: 'book.deleteBook',
        },
    ]
}