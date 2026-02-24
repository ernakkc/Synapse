import { CONFIG } from "config/config";
import { Message } from "../entities/Message";

import { analyzeMessage } from "./analyzer";
import { planAction } from "./planner/ActionPlanner";

import { ChatInteraction } from "./executor/chat_interaction/ChatInteraction";
import { SystemInteraction } from "./executor/system_interaction/SystemInteraction";
import { MemoryService } from "./memory/MemoryService";
import { MemoryExtractor } from "./memory/MemoryExtractor";

export class BrainService {
  private commingMessage: Message | null = null;
  private userMessage: string;
  private resultLanguage: string = "tr";
  private memoryService: MemoryService;
  private memoryExtractor: MemoryExtractor;
  private sessionId: string;

  constructor() {
    this.userMessage = "";
    this.commingMessage = null;
    this.memoryService = new MemoryService();
    this.memoryExtractor = new MemoryExtractor();
    this.sessionId = `session-${Date.now()}`;
  }

  async process(message: Message): Promise<string> {
    message.logger.info("Processing message:", JSON.stringify({ content: message.content, timestamp: message.timestamp }));
    this.commingMessage = message;
    this.userMessage = message.content;

    // Start episode for this interaction
    this.memoryService.startEpisode(`Interaction at ${new Date().toISOString()}`);

    // =========================
    // STEP 0: LOAD CONTEXT FROM MEMORY
    // =========================
    const recentMemories = this.memoryService.getShortTermMemories({ 
      sessionId: this.sessionId, 
      limit: 3 
    });
    
    const userKnowledge = this.memoryService.getLongTermMemories({ 
      limit: 5,
      minImportance: 0.7
    });

    // Build context string
    let contextInfo = '';
    if (userKnowledge.length > 0) {
      contextInfo += '\n[What I know about you]:\n';
      userKnowledge.forEach(mem => {
        contextInfo += `- ${mem.content}\n`;
      });
    }
    if (recentMemories.length > 0) {
      contextInfo += '\n[Recent conversation]:\n';
      recentMemories.forEach(mem => {
        contextInfo += `- ${mem.content}\n`;
      });
    }

    // Enrich message with context
    const enrichedMessage = contextInfo ? `${this.userMessage}\n${contextInfo}` : this.userMessage;

    // =========================
    // STEP 1: ANALYZE MESSAGE
    // =========================
    const analysisResult = await analyzeMessage(enrichedMessage);
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

    // Store interaction in episodic memory
    this.memoryService.addEpisodicMemory(
      `User: ${this.userMessage}`,
      { source: message.source, sessionId: this.sessionId, intent: analysisResult.intent }
    );

    if (analysisResult.type === 'CHAT_INTERACTION') {
      message.logger.info("Processing chat interaction");
      const resultChat = await ChatInteraction(analysisResult);
      
      // Store interaction in episodic memory
      this.memoryService.addEpisodicMemory(
        `Assistant: ${resultChat.substring(0, 200)}`,
        { source: message.source, sessionId: this.sessionId },
        { status: 'SUCCESS' }
      );
      
      // =========================
      // EXTRACT KNOWLEDGE FROM CONVERSATION
      // =========================
      message.logger.info("🧠 Extracting knowledge from conversation...");
      
      const conversationHistory = recentMemories.map(m => m.content);
      const extracted = await this.memoryExtractor.extractMemories(
        this.userMessage,
        resultChat,
        conversationHistory
      );

      // Store extracted facts in long-term memory
      if (extracted.userFacts.length > 0) {
        message.logger.info(`💾 Storing ${extracted.userFacts.length} user facts`);
        extracted.userFacts.forEach(fact => {
          this.memoryService.addLongTermMemory(
            fact.fact,
            fact.category === 'PERSONAL_INFO' ? 'KNOWLEDGE' : 
            fact.category === 'EDUCATION' ? 'KNOWLEDGE' : 'KNOWLEDGE',
            {
              source: message.source,
              sessionId: this.sessionId,
              category: fact.category,
              confidence: fact.confidence,
              tags: ['auto-extracted', fact.category.toLowerCase()]
            },
            fact.importance
          );
        });
      }

      // Store preferences
      if (extracted.preferences.length > 0) {
        message.logger.info(`💾 Storing ${extracted.preferences.length} preferences`);
        extracted.preferences.forEach(pref => {
          this.memoryService.addLongTermMemory(
            pref.preference,
            'USER_PREFERENCE',
            {
              source: message.source,
              sessionId: this.sessionId,
              tags: ['preference', 'auto-extracted']
            },
            pref.importance
          );
        });
      }

      // Store skills
      if (extracted.skills.length > 0) {
        message.logger.info(`💾 Storing ${extracted.skills.length} skills`);
        extracted.skills.forEach(skill => {
          this.memoryService.addLongTermMemory(
            `${skill.skill}${skill.level ? ` (${skill.level})` : ''}`,
            'SKILL',
            {
              source: message.source,
              sessionId: this.sessionId,
              level: skill.level,
              tags: ['skill', 'auto-extracted']
            },
            skill.importance
          );
        });
      }

      // Store in short-term for immediate context
      this.memoryService.addShortTermMemory(
        `Last interaction: User asked "${this.userMessage.substring(0, 50)}${this.userMessage.length > 50 ? '...' : ''}"`,
        {
          source: message.source,
          sessionId: this.sessionId,
          tags: ['conversation']
        }
      );
      
      this.memoryService.endEpisode({ status: 'SUCCESS' });
      
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
    let finalResult: string;
    
    switch (planningResult.type) {
      case "WEB_AUTOMATION": 
        finalResult = `🤖 WEB_AUTOMATION not implemented yet`;
        break;
      // OTHER TYPES 
      default: 
        finalResult = await SystemInteraction(analysisResult, planningResult);
    }

    // Store execution pattern in long-term memory
    this.memoryService.addEpisodicMemory(
      `System executed: ${planningResult.goal}`,
      { source: message.source, sessionId: this.sessionId },
      { status: 'SUCCESS' }
    );
    
    this.memoryService.endEpisode({ status: 'SUCCESS' });

    return finalResult;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return this.memoryService.getStats();
  }

  /**
   * Shutdown brain service
   */
  async shutdown() {
    await this.memoryService.shutdown();
  }
}
