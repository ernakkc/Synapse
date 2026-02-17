import { AnalysisResult } from "../../analyzer/MessageAnalyzerPrompt";
import { PlanningResult } from "../../planner/ActionPlannerPrompt";
import { Ai } from "../../../../infrastructure/ai/Ai";
import { SYSTEM_INTERACTION_PROMPT, SystemInteractionResult } from "./SystemInteractionPrompt";

export class SystemInteractionService {
    private ai: Ai;

    constructor() {
        this.ai = new Ai();
    }

    async generateCommands(analysisResult: AnalysisResult, planningResult: PlanningResult): Promise<SystemInteractionResult> {
        const prompt = this.buildPrompt(analysisResult, planningResult);
        
        const response = await this.ai.generate<SystemInteractionResult>({
            responseType: 'json',
            systemPrompt: SYSTEM_INTERACTION_PROMPT,
            prompt: prompt
        });

        // Ensure we return proper type
        if (typeof response === 'string') {
            try {
                return JSON.parse(response);
            } catch {
                // Fallback if parsing fails
                return { commands: [] } as SystemInteractionResult;
            }
        }

        return response;
    }

    private buildPrompt(analysisResult: AnalysisResult, planningResult: PlanningResult): string {
        return `Based on the user's message and the planned actions, execute the necessary system interactions.

        User said: "${analysisResult.context.user_text}"
        Intent: ${analysisResult.intent}
        Planned Actions: ${JSON.stringify(planningResult.steps, null, 2)}

        Execute the actions and return a summary of what was done.`;
        }

    async executeCommands(commands: any[]): Promise<string> {
        // Placeholder for command execution logic
        // In a real implementation, this would interact with the system or APIs as needed
        console.log("Executing commands:", JSON.stringify(commands, null, 2));

        // Simulate execution result
        return "";
    }
}

// Backward compatibility: export function
export async function SystemInteraction(analysisResult: AnalysisResult, planningResult: PlanningResult): Promise<string> {
    const service = new SystemInteractionService();
    const commands =  await service.generateCommands(analysisResult, planningResult);
    const result = await service.executeCommands(commands.commands);
    return result;
}

