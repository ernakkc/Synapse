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
                    { role: 'user', content: prompt }
                ],
                stream: false,
                format: responseType === 'json' ? 'json' : undefined
            });
        } catch (error) {
            console.error('Error occurred while fetching data from Ollama API:', error);
            throw new Error('Failed to fetch data from Ollama API');
        }

        const content = response.message.content;
        
        if (responseType === 'json') {
            // Validate content before parsing
            if (!content || content.trim() === '') {
                console.error('Ollama returned empty response');
                console.error('Request details:', { systemPrompt: systemPrompt.substring(0, 200), prompt });
                throw new Error('Ollama returned empty JSON response');
            }
            
            try {
                return JSON.parse(content) as T;
            } catch (parseError) {
                console.error('Failed to parse JSON from Ollama response');
                console.error('Raw content:', content);
                console.error('Parse error:', parseError);
                throw new Error(`Invalid JSON response from Ollama: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
            }
        } 
        return content as T | string;
    }
}