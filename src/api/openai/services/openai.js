'use strict';

/**
 * openai service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::openai.openai', ({ strapi }) => ({
    openai: async (body) => {
        try {

            const { Configuration, OpenAIApi } = require("openai");

            const configuration = new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            });
            const openai = new OpenAIApi(configuration);
            if (body.mode === 'Complete') {
                const response = await openai.createCompletion({
                    model: body.model,
                    prompt: `${body.prompt}\n\n\n${body.text}\n\n`,
                    temperature: 0.7,
                    max_tokens: body.max_length,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                });
              
                return response.data.choices[0].text.replace(/\n/g, '');

            } else if (body.mode === 'Insert') {

                const prefix = body.prompt.split('[Insert]')[0].trim();
                const suffix = body.prompt.split('[Insert]')[1].trim();
                
                const response = await openai.createCompletion({
                    model: body.model,
                    prompt: prefix,
                    suffix: suffix,
                    temperature: 0.7,
                    max_tokens: body.max_length,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                });

                return response.data.choices[0].text.replace(/\n/g, '');
            } else if (body.mode === "Edit") {
                const response = await openai.createEdit({
                    model: body.model,
                    input: body.text,
                    instruction: body.prompt,
                    temperature: 0.7,
                    top_p: 1,
                });

                return response.data.choices[0].text.replace(/\n/g, '');

            }
        } catch (error) {
            return error;
        }
    }
}));

