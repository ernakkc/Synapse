import { Ai } from "../../../infrastructure/ai/Ai";
import { PLANNER_SYSTEM_PROMPT, PlanningResult } from "./ActionPlannerPrompt";
import { AnalysisResult } from "../analyzer/MessageAnalyzerPrompt";

export async function planAction(analysisResult: AnalysisResult): Promise<PlanningResult> {
    const ai = new Ai();
    
    const analysis = await ai.generate<PlanningResult>({
        responseType: 'json',
        systemPrompt: PLANNER_SYSTEM_PROMPT,
        prompt: `Plan the following message and provide insights:\n\n${JSON.stringify(analysisResult, null, 2)}`
    });

    return analysis as PlanningResult;
}