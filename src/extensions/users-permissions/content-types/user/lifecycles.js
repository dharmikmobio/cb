module.exports = {
    async afterCreate(event) {
        const { result } = event
        if (result && result.id) {
            // By default per user has one unfiltered collection
            const res = await strapi.service("api::collection.collection").create({
                data: {
                    name: "Unfiltered",
                    author: result.id,
                    publishedAt: new Date().toISOString(),
                    collection: null,
                    is_sub_collection: false
                }
            })

            await strapi.query('plugin::users-permissions.user').update({
                where: { id: result.id },
                data: { unfiltered_collection: parseInt(res.id) }
            })

            result.unfiltered_collection = parseInt(res.id)
        }
        return result
    }
}
