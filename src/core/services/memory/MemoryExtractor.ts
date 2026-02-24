import { Ai } from '../../../infrastructure/ai/Ai';

/**
 * Memory Extraction Result
 */
export interface MemoryExtractionResult {
  userFacts: UserFact[];
  preferences: Preference[];
  skills: Skill[];
  patterns: Pattern[];
}

export interface UserFact {
  fact: string;
  category: 'PERSONAL_INFO' | 'EDUCATION' | 'WORK' | 'HOBBY' | 'RELATIONSHIP' | 'OTHER';
  importance: number;
  confidence: number;
}

export interface Preference {
  preference: string;
  importance: number;
}

export interface Skill {
  skill: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  importance: number;
}

export interface Pattern {
  pattern: string;
  frequency: number;
  importance: number;
}

/**
 * Memory Extractor Service
 * 
 * AI ile conversation'dan önemli bilgileri çıkarır
 */
export class MemoryExtractor {
  private ai: Ai;

  constructor() {
    this.ai = new Ai();
  }

  /**
   * Extract important information from user message and conversation context
   */
  async extractMemories(
    userMessage: string,
    assistantResponse: string,
    conversationHistory?: string[]
  ): Promise<MemoryExtractionResult> {
    const prompt = this.buildExtractionPrompt(userMessage, assistantResponse, conversationHistory);

    try {
      const result = await this.ai.generate<MemoryExtractionResult>({
        responseType: 'json',
        systemPrompt: MEMORY_EXTRACTION_SYSTEM_PROMPT,
        prompt
      });

      // Parse if string
      if (typeof result === 'string') {
        return JSON.parse(result);
      }

      return result;
    } catch (error) {
      console.error('Memory extraction error:', error);
      return {
        userFacts: [],
        preferences: [],
        skills: [],
        patterns: []
      };
    }
  }

  /**
   * Build extraction prompt
   */
  private buildExtractionPrompt(
    userMessage: string,
    assistantResponse: string,
    conversationHistory?: string[]
  ): string {
    let prompt = `Analyze the following conversation and extract important information about the user.\n\n`;

    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `Previous Context:\n${conversationHistory.join('\n')}\n\n`;
    }

    prompt += `Current Conversation:\n`;
    prompt += `User: ${userMessage}\n`;
    prompt += `Assistant: ${assistantResponse}\n\n`;

    prompt += `Extract:\n`;
    prompt += `1. User Facts (name, age, education, work, location, etc.)\n`;
    prompt += `2. Preferences (likes, dislikes, choices)\n`;
    prompt += `3. Skills (programming languages, tools, abilities)\n`;
    prompt += `4. Patterns (behavior, habits, communication style)\n\n`;

    prompt += `Return ONLY facts that are EXPLICITLY stated or clearly implied. Do not make assumptions.`;

    return prompt;
  }
}

/**
 * System prompt for memory extraction
 */
const MEMORY_EXTRACTION_SYSTEM_PROMPT = `You are a memory extraction AI assistant.

Your task is to analyze conversations and extract important, structured information about the user.

RULES:
1. Extract ONLY information that is explicitly stated or clearly implied
2. Assign appropriate importance (0.0-1.0):
   - 0.9-1.0: Critical long-term facts (name, job, education)
   - 0.7-0.8: Important preferences and skills
   - 0.5-0.6: Useful patterns and habits
   - 0.3-0.4: Minor details
3. Assign confidence (0.0-1.0) based on how certain you are
4. Categorize user facts appropriately
5. Extract skills with realistic level assessment

RESPONSE FORMAT (JSON):
{
  "userFacts": [
    {
      "fact": "User name is Eren Akkoç",
      "category": "PERSONAL_INFO",
      "importance": 0.95,
      "confidence": 1.0
    },
    {
      "fact": "Studies software engineering at Karadeniz Technical University, 1st year",
      "category": "EDUCATION",
      "importance": 0.9,
      "confidence": 1.0
    }
  ],
  "preferences": [
    {
      "preference": "Prefers TypeScript over JavaScript",
      "importance": 0.7
    }
  ],
  "skills": [
    {
      "skill": "TypeScript",
      "level": "INTERMEDIATE",
      "importance": 0.8
    }
  ],
  "patterns": [
    {
      "pattern": "Asks technical questions frequently",
      "frequency": 0.8,
      "importance": 0.6
    }
  ]
}

If no information is found in a category, return an empty array for that category.`;
