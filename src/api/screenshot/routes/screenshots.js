module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/collections/:collectionId/screenshots',
            handler: 'screenshot.createSreenshot',
        },
        {
            method: 'GET',
            path: '/screenshotGems',
            handler: 'screenshot.getScreenshot',
        },
        {
            method: 'GET',
            path: '/collections/:collectionId/screenshots/:gemId',
            handler: 'screenshot.getScreenshotById',
        },
        {
            method: 'PUT',
            path: '/collections/:collectionId/screenshots/:gemId',
            handler: 'screenshot.updateScreenshot',
        },
        {
            method: 'DELETE',
            path: '/collections/:collectionId/screenshots/:gemId',
            handler: 'screenshot.deleteScreenshot',
        }
    ]
}