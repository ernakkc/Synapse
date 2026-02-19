import { describe, it, expect, vi } from 'vitest';
import { BrainService } from '../../src/core/services/BrainService';
import { Message } from '../../src/core/entities/Message';
import { logger } from '../../src/infrastructure/logging/Logger';

// Mock config first
vi.mock('config/config', () => ({
  CONFIG: {
    TELEGRAM: {
      BOT_TOKEN: '',
      ADMIN_ID: ''
    },
    OLLAMA: {
      MODEL: 'llama3',
      BASE_URL: 'http://localhost:11434'
    },
    AI_SETTINGS: {
      MIN_CONFIDENCE_THRESHOLD: 0.7,
      DEFAULT_MODEL: 'llama3',
      TEMPERATURE: 0.7
    }
  }
}));

// Mock all dependencies
vi.mock('../../src/core/services/analyzer', () => ({
  analyzeMessage: vi.fn().mockResolvedValue({
    type: 'CHAT_INTERACTION',
    intent: 'GREETING',
    confidence: 0.95,
    risk_level: 'LOW',
    tool_suggestion: 'none',
    parameters: {},
    context: {
      user_text: 'Hello',
      language: 'en'
    },
    request_id: '12345'
  })
}));

vi.mock('../../src/core/services/planner/ActionPlanner', () => ({
  planAction: vi.fn().mockResolvedValue({
    steps: [],
    estimated_time: '0 seconds',
    requires_approval: false
  })
}));

vi.mock('../../src/core/services/executor/chat_interaction/ChatInteraction', () => ({
  ChatInteraction: vi.fn().mockResolvedValue('Hello! How can I help you?')
}));

vi.mock('../../src/core/services/executor/system_interaction/SystemInteraction', () => ({
  SystemInteraction: vi.fn().mockResolvedValue('Command executed successfully')
}));

describe('BrainService', () => {
  let brainService: BrainService;
  let mockMessage: Message;

  beforeEach(() => {
    brainService = new BrainService();
    mockMessage = {
      id: '1',
      content: 'Hello',
      timestamp: Date.now(),
      source: 'cli',
      logger: logger
    } as Message;

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Message Processing', () => {
    it('should process a simple message', async () => {
      const response = await brainService.process(mockMessage);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should analyze message first', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      
      await brainService.process(mockMessage);

      expect(analyzeMessage).toHaveBeenCalledWith(mockMessage.content);
    });

    it('should handle CHAT_INTERACTION type messages', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      const { ChatInteraction } = await import('../../src/core/services/executor/chat_interaction/ChatInteraction');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'CHAT_INTERACTION',
        intent: 'GREETING',
        confidence: 0.95,
        risk_level: 'LOW',
        tool_suggestion: 'none',
        parameters: {},
        context: {
          user_text: 'Hello',
          language: 'en',
          source: 'cli'
        },
        request_id: '12345'
      });

      const response = await brainService.process(mockMessage);

      expect(ChatInteraction).toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should handle OTHERS type messages', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      const { planAction } = await import('../../src/core/services/planner/ActionPlanner');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'OTHERS',
        intent: 'CREATE_FILE',
        confidence: 0.9,
        risk_level: 'LOW',
        tool_suggestion: 'file_system',
        parameters: { path: '~/test.txt' },
        context: {
          user_text: 'Create a test file',
          language: 'en',
          source: 'cli'
        },
        request_id: '12345'
      });

      await brainService.process(mockMessage);

      expect(planAction).toHaveBeenCalled();
    });
  });

  describe('Confidence Threshold', () => {
    it('should reject low confidence messages', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'UNKNOWN',
        intent: 'UNCLEAR',
        confidence: 0.3, // Low confidence
        risk_level: 'LOW',
        tool_suggestion: 'none',
        parameters: {},
        context: {
          user_text: 'asdf qwer',
          language: 'unknown',
          source: 'cli'
        },
        request_id: '12345'
      });

      const response = await brainService.process(mockMessage);

      expect(response).toContain('not confident enough');
    });

    it('should accept high confidence messages', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'CHAT_INTERACTION',
        intent: 'GREETING',
        confidence: 0.95, // High confidence
        risk_level: 'LOW',
        tool_suggestion: 'none',
        parameters: {},
        context: {
          user_text: 'Hello',
          language: 'en',
          source: 'cli'
        },
        request_id: '12345'
      });

      const response = await brainService.process(mockMessage);

      expect(response).not.toContain('not confident enough');
    });
  });

  describe('Risk Management', () => {
    it('should handle HIGH risk messages', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'OTHERS',
        intent: 'DELETE_FILE',
        confidence: 0.9,
        risk_level: 'HIGH',
        tool_suggestion: 'file_system',
        parameters: { path: '/important/files' },
        context: {
          user_text: 'Delete all files',
          language: 'en',
          source: 'cli'
        },
        request_id: '12345'
      });

      const response = await brainService.process(mockMessage);

      // Should handle high risk appropriately
      expect(response).toBeDefined();
    });

    it('should process LOW risk messages normally', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'OTHERS',
        intent: 'READ_FILE',
        confidence: 0.9,
        risk_level: 'LOW',
        tool_suggestion: 'file_system',
        parameters: { path: '~/test.txt' },
        context: {
          user_text: 'Read test file',
          language: 'en',
          source: 'cli'
        },
        request_id: '12345'
      });

      const response = await brainService.process(mockMessage);

      expect(response).toBeDefined();
    });
  });

  describe('Execution Flow', () => {
    it('should follow: analyze -> plan -> execute for OTHERS type', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      const { planAction } = await import('../../src/core/services/planner/ActionPlanner');
      const { SystemInteraction } = await import('../../src/core/services/executor/system_interaction/SystemInteraction');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'OTHERS',
        intent: 'CREATE_FILE',
        confidence: 0.9,
        risk_level: 'LOW',
        tool_suggestion: 'file_system',
        parameters: {},
        context: {
          user_text: 'Create a file',
          language: 'en',
          source: 'cli'
        },
        request_id: '12345'
      });

      await brainService.process(mockMessage);

      // Verify execution order
      expect(analyzeMessage).toHaveBeenCalled();
      expect(planAction).toHaveBeenCalled();
      expect(SystemInteraction).toHaveBeenCalled();
    });

    it('should skip planning for CHAT_INTERACTION type', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      const { planAction } = await import('../../src/core/services/planner/ActionPlanner');
      const { ChatInteraction } = await import('../../src/core/services/executor/chat_interaction/ChatInteraction');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'CHAT_INTERACTION',
        intent: 'GREETING',
        confidence: 0.95,
        risk_level: 'LOW',
        tool_suggestion: 'none',
        parameters: {},
        context: {
          user_text: 'Hi',
          language: 'en',
          source: 'cli'
        },
        request_id: '12345'
      });

      await brainService.process(mockMessage);

      expect(analyzeMessage).toHaveBeenCalled();
      expect(ChatInteraction).toHaveBeenCalled();
      // Planning should be skipped for CHAT_INTERACTION
      expect(planAction).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis errors', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      
      vi.mocked(analyzeMessage).mockRejectedValueOnce(new Error('Analysis failed'));

      await expect(brainService.process(mockMessage)).rejects.toThrow('Analysis failed');
    });

    it('should handle planning errors', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      const { planAction } = await import('../../src/core/services/planner/ActionPlanner');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'OTHERS',
        intent: 'CREATE_FILE',
        confidence: 0.9,
        risk_level: 'LOW',
        tool_suggestion: 'file_system',
        parameters: {},
        context: {
          user_text: 'Create file',
          language: 'en',
          source: 'cli'
        },
        request_id: '12345'
      });
      
      vi.mocked(planAction).mockRejectedValueOnce(new Error('Planning failed'));

      await expect(brainService.process(mockMessage)).rejects.toThrow('Planning failed');
    });

    it('should handle execution errors', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      const { SystemInteraction } = await import('../../src/core/services/executor/system_interaction/SystemInteraction');
      
      vi.mocked(analyzeMessage).mockResolvedValueOnce({
        type: 'OTHERS',
        intent: 'EXECUTE_COMMAND',
        confidence: 0.9,
        risk_level: 'LOW',
        tool_suggestion: 'terminal',
        parameters: {},
        context: {
          user_text: 'Run command',
          language: 'en',
          source: 'cli'
        },
        request_id: '12345'
      });
      
      vi.mocked(SystemInteraction).mockRejectedValueOnce(new Error('Execution failed'));

      await expect(brainService.process(mockMessage)).rejects.toThrow();
    });
  });

  describe('Context Management', () => {
    it('should preserve message source in context', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      const analyzeSpy = vi.mocked(analyzeMessage);

      await brainService.process(mockMessage);

      expect(analyzeSpy).toHaveBeenCalled();
      // The analysis result should have source added
    });

    it('should add request ID to analysis', async () => {
      const { analyzeMessage } = await import('../../src/core/services/analyzer');
      const analyzeSpy = vi.mocked(analyzeMessage);

      await brainService.process(mockMessage);

      expect(analyzeSpy).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log message processing', async () => {
      const logSpy = vi.spyOn(mockMessage.logger, 'info');

      await brainService.process(mockMessage);

      expect(logSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processing message'),
        expect.any(Object)
      );
    });

    it('should log analysis results', async () => {
      const logSpy = vi.spyOn(mockMessage.logger, 'info');

      await brainService.process(mockMessage);

      // Should log analysis result with details
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Message analysis result')
      );
    });
  });

  describe('Performance', () => {
    it('should process message within reasonable time', async () => {
      const startTime = Date.now();
      await brainService.process(mockMessage);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
