module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/prompts',
            handler: 'prompt-builder.createPromptGem',
            config: {
                policies: [],
                middlewares: [],
            },
        }
    ]
}