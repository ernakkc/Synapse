import { AnalysisResult } from "../../analyzer/MessageAnalyzerPrompt";
import { PlanningResult } from "../../planner/ActionPlannerPrompt";
import { Ai } from "../../../../infrastructure/ai/Ai";
import { SYSTEM_INTERACTION_PROMPT, SystemInteractionResult } from "./SystemInteractionPrompt";
import { CommandRunner, CommandResult } from "../../../../modules/system/runCommand";

export class SystemInteractionService {
    private ai: Ai;
    private commandRunner: CommandRunner;
    private sessionId: string = 'system-interaction-session';

    constructor() {
        this.ai = new Ai();
        this.commandRunner = new CommandRunner();
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

    async executeCommands(commands: string[]): Promise<string> {
        if (!commands || commands.length === 0) {
            return "No commands to execute.";
        }

        console.log(`📋 Executing ${commands.length} command(s)...`);
        
        try {
            // Create a persistent session for sequential command execution
            const session = await this.commandRunner.createSession(this.sessionId);
            
            const results: Array<{ command: string; result: CommandResult }> = [];
            let allSuccessful = true;

            // Execute commands sequentially in the same session
            for (let i = 0; i < commands.length; i++) {
                const command = commands[i];
                console.log(`\n🔧 [${i + 1}/${commands.length}] Executing: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
                
                try {
                    const result = await this.commandRunner.runInSession(
                        this.sessionId, 
                        command,
                        30000 // 30 second timeout per command
                    );

                    results.push({ command, result });

                    if (result.success) {
                        console.log(`✅ Success (${result.executionTime}ms)`);
                        if (result.stdout) {
                            console.log(`   Output: ${result.stdout.substring(0, 200)}${result.stdout.length > 200 ? '...' : ''}`);
                        }
                    } else {
                        console.log(`❌ Failed (${result.executionTime}ms)`);
                        console.log(`   Error: ${result.stderr}`);
                        allSuccessful = false;
                        
                        // Continue with remaining commands even if one fails
                        // You can change this behavior if you want to stop on first failure
                    }
                } catch (error: any) {
                    console.error(`❌ Error executing command: ${error.message}`);
                    allSuccessful = false;
                    
                    results.push({
                        command,
                        result: {
                            success: false,
                            stdout: '',
                            stderr: error.message,
                            exitCode: 1,
                            executionTime: 0
                        }
                    });
                }
            }

            // Close the session
            await this.commandRunner.closeSession(this.sessionId);

            // Generate summary
            return this.generateExecutionSummary(results, allSuccessful);

        } catch (error: any) {
            console.error('❌ Fatal error during command execution:', error);
            
            // Cleanup: try to close session if it was created
            try {
                await this.commandRunner.closeSession(this.sessionId);
            } catch {
                // Ignore cleanup errors
            }

            return `❌ Command execution failed: ${error.message}`;
        }
    }

    private generateExecutionSummary(
        results: Array<{ command: string; result: CommandResult }>,
        allSuccessful: boolean
    ): string {
        const totalCommands = results.length;
        const successfulCommands = results.filter(r => r.result.success).length;
        const failedCommands = totalCommands - successfulCommands;
        const totalTime = results.reduce((sum, r) => sum + r.result.executionTime, 0);

        let summary = `\n${'='.repeat(60)}\n`;
        summary += `📊 EXECUTION SUMMARY\n`;
        summary += `${'='.repeat(60)}\n\n`;
        
        summary += `📋 Total Commands: ${totalCommands}\n`;
        summary += `✅ Successful: ${successfulCommands}\n`;
        summary += `❌ Failed: ${failedCommands}\n`;
        summary += `⏱️  Total Time: ${totalTime}ms\n`;
        summary += `🎯 Status: ${allSuccessful ? '✅ All Successful' : '⚠️ Some Failed'}\n\n`;

        summary += `${'='.repeat(60)}\n`;
        summary += `📝 COMMAND DETAILS\n`;
        summary += `${'='.repeat(60)}\n\n`;

        results.forEach((item, index) => {
            const icon = item.result.success ? '✅' : '❌';
            summary += `${icon} [${index + 1}] ${item.command.substring(0, 80)}${item.command.length > 80 ? '...' : ''}\n`;
            summary += `   Time: ${item.result.executionTime}ms | Exit Code: ${item.result.exitCode}\n`;
            
            if (item.result.stdout && item.result.stdout.trim()) {
                const output = item.result.stdout.trim();
                const lines = output.split('\n');
                const preview = lines.slice(0, 3).join('\n');
                summary += `   Output: ${preview}${lines.length > 3 ? '\n   ...' : ''}\n`;
            }
            
            if (!item.result.success && item.result.stderr) {
                summary += `   Error: ${item.result.stderr.substring(0, 200)}\n`;
            }
            
            summary += '\n';
        });

        summary += `${'='.repeat(60)}\n`;

        return summary;
    }

    /**
     * Execute commands with detailed logging and return structured result
     */
    async executeCommandsWithDetails(commands: string[]): Promise<{
        success: boolean;
        totalCommands: number;
        successfulCommands: number;
        failedCommands: number;
        results: Array<{ command: string; result: CommandResult }>;
        summary: string;
    }> {
        if (!commands || commands.length === 0) {
            return {
                success: true,
                totalCommands: 0,
                successfulCommands: 0,
                failedCommands: 0,
                results: [],
                summary: "No commands to execute."
            };
        }

        try {
            const session = await this.commandRunner.createSession(this.sessionId + '-detailed');
            const results: Array<{ command: string; result: CommandResult }> = [];

            for (const command of commands) {
                try {
                    const result = await this.commandRunner.runInSession(
                        this.sessionId + '-detailed', 
                        command,
                        30000
                    );
                    results.push({ command, result });
                } catch (error: any) {
                    results.push({
                        command,
                        result: {
                            success: false,
                            stdout: '',
                            stderr: error.message,
                            exitCode: 1,
                            executionTime: 0
                        }
                    });
                }
            }

            await this.commandRunner.closeSession(this.sessionId + '-detailed');

            const successfulCommands = results.filter(r => r.result.success).length;
            const failedCommands = results.length - successfulCommands;
            const allSuccessful = failedCommands === 0;

            return {
                success: allSuccessful,
                totalCommands: results.length,
                successfulCommands,
                failedCommands,
                results,
                summary: this.generateExecutionSummary(results, allSuccessful)
            };

        } catch (error: any) {
            try {
                await this.commandRunner.closeSession(this.sessionId + '-detailed');
            } catch {
                // Ignore cleanup errors
            }

            return {
                success: false,
                totalCommands: commands.length,
                successfulCommands: 0,
                failedCommands: commands.length,
                results: [],
                summary: `❌ Fatal error: ${error.message}`
            };
        }
    }

    /**
     * Cleanup method to close any open sessions
     */
    async cleanup(): Promise<void> {
        try {
            await this.commandRunner.closeAllSessions();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Backward compatibility: export function
export async function SystemInteraction(analysisResult: AnalysisResult, planningResult: PlanningResult): Promise<string> {
    const service = new SystemInteractionService();
    const commands =  await service.generateCommands(analysisResult, planningResult);
    const result = await service.executeCommands(commands.commands);
    return result;
}

