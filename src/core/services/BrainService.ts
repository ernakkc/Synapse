import { Message } from "../entities/Message";

export class BrainService {
  async process(message: Message): Promise<string> {
    // AI logic
    message.logger.info("Processing message:", message);
    return `🤖 Echo: ${message.content}`;
  }
}
