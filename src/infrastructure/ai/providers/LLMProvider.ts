export interface LLMProvider {
    generate<T>(options: {
        responseType: 'text' | 'json';
        systemPrompt: string;
        prompt: string;
        files?: any;
        systemInformations?: any;
    }): Promise<T | string>;
}
