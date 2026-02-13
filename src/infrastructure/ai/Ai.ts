import { OllamaProvider } from "./providers/OllamaProvider";
// import { OpenAIProvider } from "./providers/OpenAIProvider";


export class Ai {
    private provider: OllamaProvider; // Şu anda sadece OllamaProvider kullanılıyor
    
    constructor() {
        this.provider = new OllamaProvider();
        // İleride farklı bir sağlayıcı eklenmek istenirse, burada seçim yapılabilir.
        // Örneğin:
        // if (CONFIG.AI_PROVIDER === 'openai') {
        //     this.provider = new OpenAIProvider();
        // } else {
        //     this.provider = new OllamaProvider();
        // }
    }
    
    async generate<T>(options: {
        responseType: 'text' | 'json';
        systemPrompt: string;
        prompt: string;
        files?: any;
        systemInformations?: any;
    }): Promise<T | string> { return this.provider.generate<T>(options)}
}
