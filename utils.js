const request = require('request');
const getColors = require("get-image-colors");
const { Configuration, OpenAIApi } = require("openai");


const awaitRequest = (options) => {
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) reject(error);
            resolve(body);
        });
    });
};

const imageColor = async (link) => {
    let col = [];
    let colors = await getColors(link);
    let hexColor = [];
    colors.map(color => hexColor.push(color.hex()));
    col.push(
        {
            url: link,
            imageColor: hexColor
        }
    )
    return col;
};

const openai = async (prompt) => {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `${prompt}`,
        temperature: 0.7,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    });
    return response.data.choices[0].text;
}

module.exports = { awaitRequest, imageColor, openai };