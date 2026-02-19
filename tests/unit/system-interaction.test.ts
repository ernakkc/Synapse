import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemInteractionService } from '../../src/core/services/executor/system_interaction/SystemInteraction';
import { AnalysisResult } from '../../src/core/services/analyzer/MessageAnalyzerPrompt';
import { PlanningResult } from '../../src/core/services/planner/ActionPlannerPrompt';

// Mock the AI and CommandRunner
vi.mock('../../src/infrastructure/ai/Ai', () => {
  return {
    Ai: vi.fn(function(this: any) {
      this.generate = vi.fn().mockResolvedValue({
        commands: ['echo "Test command"', 'pwd']
      });
    })
  };
});

describe('SystemInteractionService', () => {
  let service: SystemInteractionService;
  let mockAnalysisResult: AnalysisResult;
  let mockPlanningResult: PlanningResult;

  beforeEach(() => {
    service = new SystemInteractionService();

    mockAnalysisResult = {
      type: 'OTHERS',
      intent: 'CREATE_FILE',
      confidence: 0.95,
      summary: 'Create a test file on desktop',
      requires_approval: false,
      risk_level: 'LOW',
      tool_suggestion: 'TERMINAL',
      parameters: {
        path: '~/Desktop/test.txt',
        content: 'Hello World'
      },
      context: {
        user_text: 'Create a test file on desktop',
        language: 'en',
        source: 'cli'
      },
      fallback: {
        on_fail: 'NOTIFY',
        message: 'Failed to create file'
      },
      request_id: '12345'
    } as AnalysisResult;

    mockPlanningResult = {
      type: 'OTHERS',
      goal: 'Create file on desktop',
      status: 'PLANNED',
      risk_level: 'LOW',
      strategy: {
        mode: 'SEQUENTIAL',
        stop_on_error: true
      },
      steps: [
        {
          step_id: 1,
          name: 'Create directory',
          type: 'FILE_OPERATION',
          intent: 'CREATE_DIRECTORY',
          tool: 'terminal',
          blocking: true,
          timeout_ms: 5000,
          parameters: { path: '~/Desktop' },
          on_success: { next_step: 2 },
          on_failure: { action: 'STOP', retry_count: 0, fallback_message: 'Failed' }
        },
        {
          step_id: 2,
          name: 'Create file',
          type: 'FILE_OPERATION',
          intent: 'CREATE_FILE',
          tool: 'terminal',
          blocking: true,
          timeout_ms: 5000,
          parameters: { path: '~/Desktop/test.txt' },
          on_success: { next_step: null },
          on_failure: { action: 'STOP', retry_count: 0, fallback_message: 'Failed' }
        }
      ],
      result: {
        success: false,
        outputs: [],
        error: null
      }
    } as PlanningResult;
  });

  describe('generateCommands', () => {
    it('should generate commands from AI', async () => {
      const result = await service.generateCommands(mockAnalysisResult, mockPlanningResult);

      expect(result).toBeDefined();
      expect(result.commands).toBeInstanceOf(Array);
      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('should handle string response from AI', async () => {
      const mockService = new SystemInteractionService();
      // @ts-ignore - accessing private ai for mocking
      mockService['ai'].generate = vi.fn().mockResolvedValue('{"commands": ["echo test"]}');

      const result = await mockService.generateCommands(mockAnalysisResult, mockPlanningResult);

      expect(result.commands).toEqual(['echo test']);
    });

    it('should handle invalid JSON response', async () => {
      const mockService = new SystemInteractionService();
      // @ts-ignore
      mockService['ai'].generate = vi.fn().mockResolvedValue('invalid json');

      const result = await mockService.generateCommands(mockAnalysisResult, mockPlanningResult);

      expect(result.commands).toEqual([]);
    });

    it('should include user context in prompt', async () => {
      const generateSpy = vi.spyOn(service['ai'], 'generate');

      await service.generateCommands(mockAnalysisResult, mockPlanningResult);

      expect(generateSpy).toHaveBeenCalled();
      const callArgs = generateSpy.mock.calls[0][0];
      expect(callArgs.prompt).toContain(mockAnalysisResult.context.user_text);
      expect(callArgs.prompt).toContain(mockAnalysisResult.intent);
    });
  });

  describe('executeCommands', () => {
    it('should execute empty command list', async () => {
      const result = await service.executeCommands([]);

      expect(result).toContain('No commands to execute');
    });

    it('should execute simple commands', async () => {
      const commands = ['echo "Hello"', 'pwd'];
      const result = await service.executeCommands(commands);

      expect(result).toBeDefined();
      expect(result).toContain('EXECUTION SUMMARY');
      expect(result).toContain('Total Commands: 2');
    });

    it('should handle command failures gracefully', async () => {
      const commands = ['echo "Success"', 'nonexistent-command', 'echo "Continue"'];
      const result = await service.executeCommands(commands);

      expect(result).toContain('Total Commands: 3');
      expect(result).toContain('Some Failed');
    }, 10000);

    it('should track execution time', async () => {
      const commands = ['echo "Test"'];
      const result = await service.executeCommands(commands);

      expect(result).toContain('Total Time:');
      expect(result).toMatch(/\d+ms/);
    });

    it('should create and close session automatically', async () => {
      const commands = ['echo "Test"'];
      
      await service.executeCommands(commands);

      // Session should be closed after execution
      const activeSessions = service['commandRunner'].getActiveSessions();
      expect(activeSessions).not.toContain('system-interaction-session');
    });
  });

  describe('executeCommandsWithDetails', () => {
    it('should return detailed execution results', async () => {
      const commands = ['echo "Test1"', 'echo "Test2"'];
      const result = await service.executeCommandsWithDetails(commands);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('totalCommands');
      expect(result).toHaveProperty('successfulCommands');
      expect(result).toHaveProperty('failedCommands');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('summary');

      expect(result.totalCommands).toBe(2);
      expect(result.results).toHaveLength(2);
    });

    it('should calculate success/failure counts correctly', async () => {
      const commands = ['echo "Success"', 'nonexistent-cmd', 'pwd'];
      const result = await service.executeCommandsWithDetails(commands);

      expect(result.totalCommands).toBe(3);
      expect(result.successfulCommands).toBe(2);
      expect(result.failedCommands).toBe(1);
      expect(result.success).toBe(false);
    }, 10000);

    it('should include individual command results', async () => {
      const commands = ['echo "Hello"'];
      const result = await service.executeCommandsWithDetails(commands);

      expect(result.results[0]).toHaveProperty('command');
      expect(result.results[0]).toHaveProperty('result');
      expect(result.results[0].command).toBe('echo "Hello"');
      expect(result.results[0].result).toHaveProperty('success');
      expect(result.results[0].result).toHaveProperty('stdout');
      expect(result.results[0].result).toHaveProperty('stderr');
      expect(result.results[0].result).toHaveProperty('exitCode');
    });

    it('should handle empty command list', async () => {
      const result = await service.executeCommandsWithDetails([]);

      expect(result.success).toBe(true);
      expect(result.totalCommands).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup sessions without errors', async () => {
      await expect(service.cleanup()).resolves.not.toThrow();
    });

    it('should close all active sessions', async () => {
      // Execute some commands to create session
      await service.executeCommands(['echo "Test"']);
      
      // Cleanup
      await service.cleanup();

      // Verify all sessions are closed
      const activeSessions = service['commandRunner'].getActiveSessions();
      expect(activeSessions).toHaveLength(0);
    });
  });

  describe('Integration: generateCommands + executeCommands', () => {
    it('should generate and execute commands end-to-end', async () => {
      // Generate commands
      const commandsResult = await service.generateCommands(
        mockAnalysisResult,
        mockPlanningResult
      );

      expect(commandsResult.commands).toBeInstanceOf(Array);

      // Execute generated commands
      const summary = await service.executeCommands(commandsResult.commands);

      expect(summary).toBeDefined();
      expect(summary).toContain('EXECUTION SUMMARY');

      // Cleanup
      await service.cleanup();
    });

    it('should handle file creation workflow', async () => {
      const fileAnalysis: AnalysisResult = {
        ...mockAnalysisResult,
        intent: 'CREATE_FILE',
        parameters: {
          path: '/tmp/test-file-' + Date.now() + '.txt',
          content: 'Test content'
        }
      };

      const filePlan: PlanningResult = {
        steps: [
          { action: 'CREATE_FILE', path: fileAnalysis.parameters.path }
        ]
      } as PlanningResult;

      const commands = await service.generateCommands(fileAnalysis, filePlan);
      const result = await service.executeCommands(commands.commands);

      expect(result).toContain('Total Commands');
      
      await service.cleanup();
    }, 10000);
  });

  describe('Error Scenarios', () => {
    it('should handle AI generation failure', async () => {
      const mockService = new SystemInteractionService();
      // @ts-ignore
      mockService['ai'].generate = vi.fn().mockRejectedValue(new Error('AI Error'));

      await expect(
        mockService.generateCommands(mockAnalysisResult, mockPlanningResult)
      ).rejects.toThrow('AI Error');
    });

    it('should handle command execution timeout', async () => {
      const commands = ['sleep 100']; // Long running command
      
      const result = await service.executeCommandsWithDetails(commands);

      // Should complete (with timeout) rather than hang
      expect(result).toBeDefined();
    }, 35000); // Allow time for timeout

    it('should continue execution after command failure', async () => {
      const commands = [
        'echo "Before"',
        'exit 1', // This will fail
        'echo "After"'
      ];

      const result = await service.executeCommandsWithDetails(commands);

      expect(result.totalCommands).toBe(3);
      // Should have attempted all commands
      expect(result.results).toHaveLength(3);
    }, 10000);
  });

  describe('Prompt Building', () => {
    it('should build prompt with correct structure', async () => {
      const buildPromptSpy = vi.spyOn(service as any, 'buildPrompt');

      await service.generateCommands(mockAnalysisResult, mockPlanningResult);

      expect(buildPromptSpy).toHaveBeenCalled();
      const prompt = buildPromptSpy.mock.results[0].value;

      expect(prompt).toContain('User said:');
      expect(prompt).toContain('Intent:');
      expect(prompt).toContain('Planned Actions:');
      expect(prompt).toContain(mockAnalysisResult.context.user_text);
    });

    it('should include planning steps in prompt', async () => {
      const buildPromptSpy = vi.spyOn(service as any, 'buildPrompt');

      await service.generateCommands(mockAnalysisResult, mockPlanningResult);

      const prompt = buildPromptSpy.mock.results[0].value;
      expect(prompt).toContain(JSON.stringify(mockPlanningResult.steps, null, 2));
    });
  });

  describe('Summary Generation', () => {
    it('should generate readable summary', async () => {
      const commands = ['echo "Test"', 'pwd'];
      const result = await service.executeCommands(commands);

      expect(result).toContain('='.repeat(60));
      expect(result).toContain('📊 EXECUTION SUMMARY');
      expect(result).toContain('📋 Total Commands:');
      expect(result).toContain('✅ Successful:');
      expect(result).toContain('❌ Failed:');
      expect(result).toContain('⏱️  Total Time:');
      expect(result).toContain('🎯 Status:');
    });

    it('should include command details in summary', async () => {
      const commands = ['echo "Hello World"'];
      const result = await service.executeCommands(commands);

      expect(result).toContain('📝 COMMAND DETAILS');
      expect(result).toContain('echo "Hello World"');
      expect(result).toContain('Time:');
      expect(result).toContain('Exit Code:');
    });

    it('should show correct status for all successful', async () => {
      const commands = ['echo "Test"'];
      const result = await service.executeCommands(commands);

      expect(result).toContain('✅ All Successful');
    });

    it('should show correct status with failures', async () => {
      const commands = ['echo "Test"', 'nonexistent-cmd'];
      const result = await service.executeCommands(commands);

      expect(result).toContain('⚠️ Some Failed');
    }, 10000);
  });
});
