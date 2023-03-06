module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/movies',
            handler: 'movies-view-list.searchByMovieName',
        },
        {
            method: 'POST',
            path: '/collections/:collectionId/moviegems',
            handler: 'movies-view-list.createMovieGem',
        },
        {
            method: 'GET',
            path: '/moviegems',
            handler: 'movies-view-list.getAllMovie',
        },
        {
            method: 'GET',
            path: '/collections/:collectionId/moviegems/:gemId',
            handler: 'movies-view-list.getMovieByGemId',
        },
        {
            method: 'PUT',
            path: '/collections/:collectionId/moviegems/:gemId',
            handler: 'movies-view-list.updateMovieGem',
        },
        {
            method: 'DELETE',
            path: '/collections/:collectionId/moviegems/:gemId',
            handler: 'movies-view-list.deleteMovieGem',
        },
    ]
}