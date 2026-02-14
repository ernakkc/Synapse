import { Ollama } from 'ollama';
import { CONFIG } from '../../../../config/config';
import { LLMProvider } from './LLMProvider';

export class OllamaProvider implements LLMProvider {
    private ollama: Ollama;

    constructor() {
        this.ollama = new Ollama({
            host: `${CONFIG.OLLAMA.BASE_URL}`
        });
    }


    async generate<T>(options: {
        responseType: 'text' | 'json';
        systemPrompt: string;
        prompt: string;
        files?: any;
        systemInformations?: any;
    }): Promise<T | string> {
        const { responseType, systemPrompt, prompt } = options;

        let response;

        try {
            response = await this.ollama.chat({
                model: CONFIG.OLLAMA.MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                    { role: 'assistant', content: 'Please provide a response based on the system prompt and user prompt.' }
                ],
                stream: false,
                format: responseType
            });
        } catch (error) {
            console.error('Error occurred while fetching data from Ollama API:', error);
            throw new Error('Failed to fetch data from Ollama API');
        }

        const content = response.message.content;
        
        if (responseType === 'json') {
            return JSON.parse(content) as T;
        } 
        return content as T | string;
    }
}