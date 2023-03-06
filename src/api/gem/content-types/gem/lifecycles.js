module.exports = {
    async afterCreate(data) {
        const { params } = data
        if (params && params.data?.collection_gems) {
            const collId     = data.params?.data?.collection_gems
            const collection = await strapi.entityService.findOne("api::collection.collection", collId, {
                populate: {
                    gems: {
                        fields: [ "id", "title" ]
                    }
                }
            })
            if (collection && collection.gems) {
                await strapi.entityService.update("api::collection.collection", collId, {
                    data: {
                        gems: [ ...collection.gems, data.result?.id ]
                    }
                })
            }
        }
    },
};