module.exports = {
  routes: [
    { // Path defined with an URL parameter
      method: 'POST',
      path: '/import-collections',
      handler: 'collection.importCollection',
    },
    { // Path defined with an URL parameter
      method: 'GET',
      path: '/get-user-collections',
      handler: 'collection.getUserCollections',
    },
    { // Path defined with an URL parameter
      method: 'GET',
      path: '/bookmark/collections',
      handler: 'collection.getUserBookmarkCollections',
    },
    { // Path defined with an URL parameter
      method: 'POST',
      path: '/collections/:sourceCollectionId/move/:destinationCollectionId',
      handler: 'collection.moveCollections',
    },
    { // Path defined with an URL parameter
      method: 'POST',
      path: '/collections/:sourceCollectionId/move-to-root',
      handler: 'collection.moveToRootCollections',
    },
  ]
}