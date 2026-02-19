import { CONFIG } from "config/config";
import { Message } from "../entities/Message";

import { analyzeMessage } from "./analyzer";
import { planAction } from "./planner/ActionPlanner";

import { ChatInteraction } from "./executor/chat_interaction/ChatInteraction";
import { SystemInteraction } from "./executor/system_interaction/SystemInteraction";
export class BrainService {
  private commingMessage: Message | null = null;
  private userMessage: string;
  private resultLanguage: string = "tr";

  constructor() {
    this.userMessage = "";
    this.commingMessage = null;
  }

  async process(message: Message): Promise<string> {
    message.logger.info("Processing message:", JSON.stringify({ content: message.content, timestamp: message.timestamp }));
    this.commingMessage = message;
    this.userMessage = message.content;

    // =========================
    // STEP 1: ANALYZE MESSAGE
    // =========================
    const analysisResult = await analyzeMessage(this.userMessage);
    analysisResult.context.source = message.source;
    analysisResult.request_id = message.timestamp.toString();

    // Filter out null/undefined parameters for cleaner output
    const cleanParams = Object.fromEntries(
      Object.entries(analysisResult.parameters).filter(([_, value]) => value !== null && value !== undefined)
    );

    message.logger.info(
      `📊 Message analysis result:\n` +
      `  🏷️  Type: ${analysisResult.type}\n` +
      `  🎯 Intent: ${analysisResult.intent}\n` +
      `  📈 Confidence: ${(analysisResult.confidence * 100).toFixed(1)}%\n` +
      `  🔴 Risk Level: ${analysisResult.risk_level}\n` +
      `  🔧 Tool Suggestion: ${analysisResult.tool_suggestion}\n` +
      `  ⚙️  Parameters: ${JSON.stringify(cleanParams, null, 2)}\n` +
      `  🌍 Context: ${JSON.stringify(analysisResult.context, null, 2)}`
    );
    if (analysisResult.confidence < CONFIG.AI_SETTINGS.MIN_CONFIDENCE_THRESHOLD) {
      return `⚠️  I'm not confident enough to process this request. ` +
        `Please try rephrasing or adding more details.`;
    }
    if (analysisResult.risk_level === 'HIGH') {
      const approvalResult = message.approval ? await message.approval(message, analysisResult) : false;
      if (!approvalResult) {
        return `❌ Request denied by user.`;
      }
    }

    if (analysisResult.type === 'CHAT_INTERACTION') {
      message.logger.info("Processing chat interaction");
          const resultChat = await ChatInteraction(analysisResult);
          return resultChat;
    }

    // =========================
    // STEP 2: ACTION PLANNER
    // =========================
    const planningResult = await planAction(analysisResult);
    planningResult.request_id = message.timestamp.toString();
    planningResult.language = this.resultLanguage;
    message.logger.info(
      `🧠 Action planning result:\n` +
      `  🏷️  Type: ${planningResult.type}\n` +
      `  🎯 Goal: ${planningResult.goal}\n` +
      `  📋 Steps: ${planningResult.steps.length}\n` +
      `  🔄 Strategy: ${planningResult.strategy.mode}\n` +
      `  ⚠️  Risk Level: ${planningResult.risk_level}\n` +
      `  🧾 Status: ${planningResult.status}`);

    // =========================
    // STEP 3: ROTATE RESPONSE
    // =========================
    switch (planningResult.type) {
      case "WEB_AUTOMATION": break;
      // OTHER TYPES 
      default: 
        return await SystemInteraction(analysisResult, planningResult);
    }



    return `🤖 FINISH`;
  }
}
