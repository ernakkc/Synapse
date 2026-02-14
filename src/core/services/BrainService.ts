import { CONFIG } from "config/config";
import { Message } from "../entities/Message";

import { analyzeMessage} from "./analyzer";
import { requestApprovalFromUser } from "@interfaces/cli/helpers/Approval";

export class BrainService {
  private commingMessage: Message | null = null;
  private userMessage:string;

  constructor() {
    this.userMessage = "";
    this.commingMessage = null;
  }

  async process(message: Message): Promise<string> {
    message.logger.info("Processing message:", message);
    this.commingMessage = message;
    this.userMessage = message.content;

    // =========================
    // STEP 1: ANALYZE MESSAGE
    // =========================
    const analysisResult = await analyzeMessage(this.userMessage);
    analysisResult.context.source = message.source; 
    analysisResult.request_id = message.timestamp.toString();
    message.logger.info(
      `📊 Message analysis result:\n` +
      `  🏷️  Type: ${analysisResult.type}\n` +
      `  🎯 Intent: ${analysisResult.intent}\n` +
      `  📈 Confidence: ${analysisResult.confidence}%\n` +
      `  🔧 Tool Suggestion: ${analysisResult.tool_suggestion}\n` +
      `  ⚙️  Parameters: ${JSON.stringify(analysisResult.parameters, null, 2)}\n` +
      `  🌍 Context: ${JSON.stringify(analysisResult.context, null, 2)}`
    );
    if (analysisResult.confidence < CONFIG.AI_SETTINGS.MIN_CONFIDENCE_THRESHOLD) {
      return `⚠️  I'm not confident enough to process this request. ` +
             `Please try rephrasing or adding more details.`;
    }
    if (analysisResult.risk_level === 'HIGH') {
      const approvalResult = await requestApprovalFromUser(message, analysisResult);
      if (!approvalResult) {
        return `❌ Request denied by user.`;
      }
    }


    // =========================
    // STEP 2: ACTION PLANNER
    // =========================

    // =========================
    // STEP 3: ROTATE RESPONSE
    // =========================

    return `🤖 Echo: ${message.content}`;
  }
}
