import { Message } from "../entities/Message";

import { analyzeMessage} from "./analyzer";

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
    message.logger.info("Message analysis result:", analysisResult);
    return JSON.stringify(analysisResult);

    // =========================
    // STEP 2: ACTION PLANNER
    // =========================

    // =========================
    // STEP 3: ROTATE RESPONSE
    // =========================

    return `🤖 Echo: ${message.content}`;
  }
}
