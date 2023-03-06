const deleteGemsAndSubfolders = async (collectionId) => {
    const allSubfolders = await strapi.db.query('api::collection.collection').findMany({
        where: {
            collection: {
                id: collectionId
            },
        }
    })

    allSubfolders.forEach(async (a) => {
        if (a.collection && a.collection.id) {
            deleteGemsAndSubfolders(a.collection.id)
        }
        const allGems       = await strapi.db.query("api::gem.gem").findMany({
            where: {
                collection_gems: a.id
            }
        })
        await strapi.db.query("api::gem.gem").deleteMany({
            where: {
                id: {
                    $in: allGems.map((g) => { return g.id })
                }
            }
        })
        await strapi.db.query('api::collection.collection').delete({
            where: {
              id: a.id,
            },
        })
    })
}
module.exports = {
    async beforeDelete(event) {
        const { params } = event
        if (params && params.where?.id) {
            deleteGemsAndSubfolders(params.where?.id)
        }
    }
    
};