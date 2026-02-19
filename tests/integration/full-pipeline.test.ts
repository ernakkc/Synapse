import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { BrainService } from '../../src/core/services/BrainService';
import { Message } from '../../src/core/entities/Message';
import { logger } from '../../src/infrastructure/logging/Logger';
import { CommandRunner } from '../../src/modules/system/runCommand';

// Mock config
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

describe('Integration Tests: End-to-End Message Processing', () => {
  let brainService: BrainService;
  let commandRunner: CommandRunner;

  beforeAll(() => {
    brainService = new BrainService();
    commandRunner = new CommandRunner();
  });

  afterAll(async () => {
    // Cleanup
    await commandRunner.closeAllSessions();
  });

  describe('Complete Message Flow', () => {
    it('should process greeting message end-to-end', async () => {
      const message: Message = {
        id: 'test-1',
        content: 'Hello, how are you?',
        timestamp: Date.now(),
        source: 'cli',
        logger: logger
      } as Message;

      const response = await brainService.process(message);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }, 10000);

    it('should process simple question', async () => {
      const message: Message = {
        id: 'test-2',
        content: 'What is your name?',
        timestamp: Date.now(),
        source: 'cli',
        logger: logger
      } as Message;

      const response = await brainService.process(message);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    }, 10000);

    it('should handle system information request', async () => {
      const message: Message = {
        id: 'test-3',
        content: 'Show me the current directory',
        timestamp: Date.now(),
        source: 'cli',
        logger: logger
      } as Message;

      const response = await brainService.process(message);

      expect(response).toBeDefined();
    }, 15000);
  });

  describe('CommandRunner Integration', () => {
    it('should execute simple command', async () => {
      const result = await commandRunner.run('echo "Integration Test"');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Integration Test');
      expect(result.exitCode).toBe(0);
    });

    it('should handle session creation and execution', async () => {
      const sessionId = 'integration-test-session';
      
      // Create session
      const session = await commandRunner.createSession(sessionId);
      expect(session).toBeDefined();

      // Execute in session
      const result = await commandRunner.runInSession(sessionId, 'pwd');
      expect(result.success).toBe(true);

      // Cleanup
      await commandRunner.closeSession(sessionId);
    });

    it('should execute multiple commands sequentially', async () => {
      const commands = [
        'echo "Step 1"',
        'echo "Step 2"',
        'echo "Step 3"'
      ];

      const results = await commandRunner.runSequence(commands);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('File System Operations', () => {
    it('should create and read file', async () => {
      const testFile = '/tmp/integration-test-' + Date.now() + '.txt';
      const content = 'Integration test content';

      // Create file
      const createResult = await commandRunner.run(`echo "${content}" > ${testFile}`);
      expect(createResult.success).toBe(true);

      // Read file
      const readResult = await commandRunner.run(`cat ${testFile}`);
      expect(readResult.success).toBe(true);
      expect(readResult.stdout).toContain(content);

      // Cleanup
      await commandRunner.run(`rm ${testFile}`);
    });

    it('should handle directory operations', async () => {
      const testDir = '/tmp/integration-dir-' + Date.now();

      // Create directory
      const mkdirResult = await commandRunner.run(`mkdir -p ${testDir}`);
      expect(mkdirResult.success).toBe(true);

      // Verify directory exists
      const lsResult = await commandRunner.run(`ls -d ${testDir}`);
      expect(lsResult.success).toBe(true);

      // Remove directory
      const rmdirResult = await commandRunner.run(`rm -rf ${testDir}`);
      expect(rmdirResult.success).toBe(true);
    });
  });

  describe('Pipeline Integration', () => {
    it('should handle analyzer -> planner -> executor flow', async () => {
      const message: Message = {
        id: 'pipeline-test',
        content: 'List files in current directory',
        timestamp: Date.now(),
        source: 'cli',
        logger: logger
      } as Message;

      const startTime = Date.now();
      const response = await brainService.process(message);
      const duration = Date.now() - startTime;

      expect(response).toBeDefined();
      expect(duration).toBeGreaterThan(0);
      
      // Log performance
      console.log(`Pipeline processing took ${duration}ms`);
    }, 20000);
  });

  describe('Error Recovery', () => {
    it('should recover from command failures', async () => {
      const commands = [
        'echo "Before error"',
        'nonexistent-command-xyz',
        'echo "After error"'
      ];

      const results = await commandRunner.runSequence(commands);

      // Should stop at failure
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it('should handle parallel command failures', async () => {
      const commands = [
        'echo "Success 1"',
        'nonexistent-cmd',
        'echo "Success 2"'
      ];

      const results = await commandRunner.runParallel(commands);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple sequential messages', async () => {
      const messages = [
        'Hello',
        'What time is it?',
        'Tell me a joke'
      ];

      const startTime = Date.now();

      for (const content of messages) {
        const message: Message = {
          id: `perf-${Date.now()}`,
          content,
          timestamp: Date.now(),
          source: 'cli',
          logger: logger
        } as Message;

        await brainService.process(message);
      }

      const duration = Date.now() - startTime;
      const avgTime = duration / messages.length;

      console.log(`Average processing time: ${avgTime}ms per message`);
      
      // Should complete within reasonable time
      expect(avgTime).toBeLessThan(10000);
    }, 30000);

    it('should execute commands efficiently', async () => {
      const startTime = Date.now();

      await commandRunner.runParallel([
        'echo "Task 1"',
        'echo "Task 2"',
        'echo "Task 3"',
        'echo "Task 4"',
        'echo "Task 5"'
      ]);

      const duration = Date.now() - startTime;

      // Parallel execution should be fast
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Session Management', () => {
    it('should manage multiple sessions', async () => {
      const sessions = ['session1', 'session2', 'session3'];

      // Create all sessions
      for (const id of sessions) {
        await commandRunner.createSession(id);
      }

      // Verify all active
      const activeSessions = commandRunner.getActiveSessions();
      expect(activeSessions.length).toBeGreaterThanOrEqual(sessions.length);

      // Execute in each session
      for (const id of sessions) {
        const result = await commandRunner.runInSession(id, 'echo "Test"');
        expect(result.success).toBe(true);
      }

      // Close all
      for (const id of sessions) {
        await commandRunner.closeSession(id);
      }

      // Verify none active
      const finalSessions = commandRunner.getActiveSessions();
      expect(finalSessions).not.toContain('session1');
      expect(finalSessions).not.toContain('session2');
      expect(finalSessions).not.toContain('session3');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle git status check', async () => {
      const message: Message = {
        id: 'git-test',
        content: 'Show git status',
        timestamp: Date.now(),
        source: 'cli',
        logger: logger
      } as Message;

      const response = await brainService.process(message);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    }, 15000);

    it('should handle file listing', async () => {
      const result = await commandRunner.run('ls -la');

      expect(result.success).toBe(true);
      expect(result.stdout).toBeTruthy();
    });

    it('should handle system info query', async () => {
      const info = commandRunner.getSystemInfo();

      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('arch');
      expect(info).toHaveProperty('cpus');
      expect(info).toHaveProperty('totalMemory');
      expect(info.cpus).toBeGreaterThan(0);
    });
  });

  describe('Complex Workflows', () => {
    it('should handle multi-step directory creation', async () => {
      const baseDir = '/tmp/complex-test-' + Date.now();
      
      const commands = [
        `mkdir -p ${baseDir}/src`,
        `mkdir -p ${baseDir}/tests`,
        `echo "# README" > ${baseDir}/README.md`,
        `ls -R ${baseDir}`
      ];

      const results = await commandRunner.runSequence(commands);

      expect(results.length).toBeGreaterThan(0);
      expect(results[results.length - 1].stdout).toContain('README.md');

      // Cleanup
      await commandRunner.run(`rm -rf ${baseDir}`);
    });
  });
});
