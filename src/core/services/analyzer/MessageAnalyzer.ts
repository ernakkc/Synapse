import { Ai } from "../../../infrastructure/ai/Ai";
import { ANALYZER_SYSTEM_PROMPT, AnalysisResult } from "./MessageAnalyzerPrompt";

export class MessageAnalyzer {
    private ai: Ai;

    constructor() {
        this.ai = new Ai();
    }

    async analyze(message: string): Promise<AnalysisResult> {
        const analysis = await this.ai.generate<AnalysisResult>({
            responseType: 'json',
            systemPrompt: ANALYZER_SYSTEM_PROMPT,
            prompt: `Analyze the following message and provide insights:\n\n${message}`
        });

        return analysis as AnalysisResult;
    }
}

export async function analyzeMessage(message: string): Promise<AnalysisResult> {
    const analyzer = new MessageAnalyzer();
    return analyzer.analyze(message);
}