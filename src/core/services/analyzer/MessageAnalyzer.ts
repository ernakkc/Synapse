import { Ai } from "../../../infrastructure/ai/Ai";
import { ANALYZER_SYSTEM_PROMPT, AnalysisResult } from "./MessageAnalyzerPrompt";

export async function analyzeMessage(message: string): Promise<AnalysisResult> {
    const ai = new Ai();
    
    const analysis = await ai.generate<AnalysisResult>({
        responseType: 'json',
        systemPrompt: ANALYZER_SYSTEM_PROMPT,
        prompt: `Analyze the following message and provide insights:\n\n${message}`
    });

    return analysis as AnalysisResult;
}