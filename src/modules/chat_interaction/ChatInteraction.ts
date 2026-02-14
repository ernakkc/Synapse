import { PlanningResult } from "../../core/services/planner/ActionPlannerPrompt";
import { AnalysisResult } from "../../core/services/analyzer/MessageAnalyzerPrompt";
import { Ai } from "../../infrastructure/ai/Ai";

import { CHAT_SYSTEM_PROMPT, ChatInteractionResult } from "./ChatInteractionPrompt";


export async function ChatInteraction(planningResult: PlanningResult, analysisResult: AnalysisResult): Promise<string> {
    const ai = new Ai();

    const prompt = `## USER REQUEST
Original message: "${analysisResult.context.user_text}"
Language: ${analysisResult.context.language}

## ANALYSIS
Intent: ${analysisResult.intent}
Type: ${analysisResult.type}
Confidence: ${analysisResult.confidence}%

## PLANNING
Goal: ${planningResult.goal}
Steps: ${planningResult.steps.length}

Provide a natural response to the user's original message.`;

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
