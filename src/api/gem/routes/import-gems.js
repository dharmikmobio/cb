module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/highlight-gems',
      handler: 'gem.getAllHighlights'
    },
    { // Path defined with an URL parameter
      method: 'POST',
      path: '/import-gems',
      handler: 'gem.importGem',
    }
  ]
}