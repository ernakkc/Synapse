import { PlanningResult } from "../../core/services/planner/ActionPlannerPrompt";
import { AnalysisResult } from "../../core/services/analyzer/MessageAnalyzerPrompt";
import { Ai } from "../../infrastructure/ai/Ai";

import { CHAT_SYSTEM_PROMPT, ChatInteractionResult } from "./ChatInteractionPrompt";


export async function ChatInteraction(analysisResult: AnalysisResult): Promise<string> {
    const ai = new Ai();

    const prompt = `User said: "${analysisResult.context.user_text}"
Language: ${analysisResult.context.language}
Intent: ${analysisResult.intent}

Respond naturally to the user. DO NOT explain or analyze their words. Just chat like a friend.`;

    const response = await ai.generate<ChatInteractionResult>({
        responseType: 'json',
        systemPrompt: CHAT_SYSTEM_PROMPT,
        prompt: prompt
    });

    // Extract and return the response text
    return typeof response === 'object' && response.response 
        ? response.response 
        : String(response);
}
