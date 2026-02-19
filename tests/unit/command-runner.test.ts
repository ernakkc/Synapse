import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CommandRunner, TerminalSession } from '../../src/modules/system/runCommand';
import * as os from 'os';

describe('CommandRunner', () => {
  let runner: CommandRunner;

  beforeEach(() => {
    runner = new CommandRunner();
  });

  afterEach(async () => {
    // Cleanup all sessions
    await runner.closeAllSessions();
  });

  describe('Basic Command Execution', () => {
    it('should execute a simple command successfully', async () => {
      const result = await runner.run('echo "Hello World"');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello World');
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle command failure', async () => {
      const result = await runner.run('nonexistent-command-12345');

      expect(result.success).toBe(false);
      expect(result.stderr).toBeTruthy();
      expect(result.exitCode).not.toBe(0);
    });

    it('should capture stdout correctly', async () => {
      const result = await runner.run('echo "Test Output"');

      expect(result.stdout).toContain('Test Output');
      expect(result.stderr).toBe('');
    });

    it('should respect working directory option', async () => {
      const result = await runner.run('pwd', { cwd: '/tmp' });

      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toContain('tmp');
    });

    it('should handle timeout', async () => {
      const result = await runner.run('sleep 10', { timeout: 100 });

      expect(result.success).toBe(false);
      expect(result.stderr).toBeTruthy();
    }, 10000);
  });

  describe('Sequential Command Execution', () => {
    it('should execute commands in sequence', async () => {
      const commands = [
        'echo "Step 1"',
        'echo "Step 2"',
        'echo "Step 3"'
      ];

      const results = await runner.runSequence(commands);

      expect(results).toHaveLength(3);
      expect(results[0].stdout).toContain('Step 1');
      expect(results[1].stdout).toContain('Step 2');
      expect(results[2].stdout).toContain('Step 3');
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should stop on first failure in sequence', async () => {
      const commands = [
        'echo "Step 1"',
        'nonexistent-command',
        'echo "Step 3"'
      ];

      const results = await runner.runSequence(commands);

      expect(results).toHaveLength(2); // Should stop after second command
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Parallel Command Execution', () => {
    it('should execute commands in parallel', async () => {
      const commands = [
        'echo "Task 1"',
        'echo "Task 2"',
        'echo "Task 3"'
      ];

      const startTime = Date.now();
      const results = await runner.runParallel(commands);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      // Parallel should be faster than sequential
      expect(duration).toBeLessThan(1000);
    });

    it('should return all results even if some fail', async () => {
      const commands = [
        'echo "Success"',
        'nonexistent-command',
        'echo "Also Success"'
      ];

      const results = await runner.runParallel(commands);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Terminal Sessions', () => {
    it('should create and manage terminal session', async () => {
      const sessionId = 'test-session';
      const session = await runner.createSession(sessionId);

      expect(session).toBeInstanceOf(TerminalSession);
      expect(session.isSessionActive()).toBe(true);
      expect(runner.getActiveSessions()).toContain(sessionId);

      await runner.closeSession(sessionId);
      expect(runner.getActiveSessions()).not.toContain(sessionId);
    });

    it('should execute command in session', async () => {
      const sessionId = 'exec-session';
      await runner.createSession(sessionId);

      const result = await runner.runInSession(sessionId, 'echo "In Session"');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('In Session');

      await runner.closeSession(sessionId);
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        runner.runInSession('non-existent', 'echo test')
      ).rejects.toThrow();
    });

    it('should prevent duplicate session creation', async () => {
      const sessionId = 'duplicate-test';
      await runner.createSession(sessionId);

      await expect(
        runner.createSession(sessionId)
      ).rejects.toThrow();

      await runner.closeSession(sessionId);
    });

    it('should close all sessions', async () => {
      await runner.createSession('session1');
      await runner.createSession('session2');
      await runner.createSession('session3');

      expect(runner.getActiveSessions()).toHaveLength(3);

      await runner.closeAllSessions();

      expect(runner.getActiveSessions()).toHaveLength(0);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed commands', async () => {
      let attempts = 0;
      const mockRunner = new CommandRunner();
      
      // Mock run to fail twice then succeed
      const originalRun = mockRunner.run.bind(mockRunner);
      mockRunner.run = async (cmd: string, opts?: any) => {
        attempts++;
        if (attempts < 3) {
          return {
            success: false,
            stdout: '',
            stderr: 'Simulated failure',
            exitCode: 1,
            executionTime: 10
          };
        }
        return originalRun(cmd, opts);
      };

      const result = await mockRunner.runWithRetry('echo "Success"', {
        maxRetries: 3,
        retryDelay: 100
      });

      expect(attempts).toBe(3);
      expect(result.success).toBe(true);
    }, 10000);

    it('should respect max retries', async () => {
      const result = await runner.runWithRetry('nonexistent-command', {
        maxRetries: 2,
        retryDelay: 50
      });

      expect(result.success).toBe(false);
    }, 5000);
  });

  describe('Command Existence Check', () => {
    it('should detect existing command', async () => {
      const exists = await runner.commandExists('echo');
      expect(exists).toBe(true);
    });

    it('should detect non-existing command', async () => {
      const exists = await runner.commandExists('nonexistent-command-xyz');
      expect(exists).toBe(false);
    });

    it('should check platform-specific commands', async () => {
      const platform = os.platform();
      if (platform === 'darwin' || platform === 'linux') {
        expect(await runner.commandExists('ls')).toBe(true);
      } else if (platform === 'win32') {
        expect(await runner.commandExists('dir')).toBe(true);
      }
    });
  });

  describe('System Information', () => {
    it('should return system info', () => {
      const info = runner.getSystemInfo();

      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('arch');
      expect(info).toHaveProperty('hostname');
      expect(info).toHaveProperty('cpus');
      expect(info).toHaveProperty('totalMemory');
      expect(info).toHaveProperty('freeMemory');

      expect(typeof info.cpus).toBe('number');
      expect(info.cpus).toBeGreaterThan(0);
      expect(info.totalMemory).toBeGreaterThan(0);
    });

    it('should return valid platform', () => {
      const info = runner.getSystemInfo();
      const validPlatforms = ['darwin', 'linux', 'win32', 'aix', 'freebsd', 'openbsd', 'sunos'];
      
      expect(validPlatforms).toContain(info.platform);
    });
  });

  describe('Error Handling', () => {
    it('should handle stderr output', async () => {
      // Command that writes to stderr but still succeeds
      const result = await runner.run('echo "Error message" >&2');

      expect(result.stderr).toBeTruthy();
    });

    it('should handle commands with special characters', async () => {
      const result = await runner.run('echo "Test with special ch@rs!"');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('ch@rs');
    });

    it('should handle empty commands gracefully', async () => {
      const result = await runner.run('');

      expect(result.success).toBe(false);
    });
  });

  describe('File Operations', () => {
    it('should create and read file', async () => {
      const testFile = '/tmp/test-file-' + Date.now() + '.txt';
      const testContent = 'Test Content';

      // Create file
      const createResult = await runner.run(`echo "${testContent}" > ${testFile}`);
      expect(createResult.success).toBe(true);

      // Read file
      const readResult = await runner.run(`cat ${testFile}`);
      expect(readResult.success).toBe(true);
      expect(readResult.stdout).toContain(testContent);

      // Cleanup
      await runner.run(`rm ${testFile}`);
    });

    it('should handle directory operations', async () => {
      const testDir = '/tmp/test-dir-' + Date.now();

      // Create directory
      const mkdirResult = await runner.run(`mkdir -p ${testDir}`);
      expect(mkdirResult.success).toBe(true);

      // Check directory exists
      const lsResult = await runner.run(`ls -d ${testDir}`);
      expect(lsResult.success).toBe(true);

      // Remove directory
      const rmdirResult = await runner.run(`rm -rf ${testDir}`);
      expect(rmdirResult.success).toBe(true);
    });
  });
});

describe('TerminalSession', () => {
  let session: TerminalSession;

  beforeEach(async () => {
    session = new TerminalSession();
    await session.open();
  });

  afterEach(async () => {
    if (session.isSessionActive()) {
      await session.close();
    }
  });

  it('should open a session', () => {
    expect(session.isSessionActive()).toBe(true);
  });

  it('should execute command in session', async () => {
    const result = await session.execute('echo "Test"');
    
    expect(result.success).toBeDefined();
    expect(result.executionTime).toBeGreaterThan(0);
  });

  it('should maintain command history', async () => {
    await session.execute('echo "Command 1"');
    await session.execute('echo "Command 2"');
    await session.execute('pwd');

    const history = session.getHistory();
    
    expect(history).toHaveLength(3);
    expect(history[0]).toContain('Command 1');
    expect(history[1]).toContain('Command 2');
    expect(history[2]).toBe('pwd');
  });

  it('should clear buffers', async () => {
    await session.execute('echo "Test"');
    
    expect(session.getOutput()).toBeTruthy();
    
    session.clearBuffers();
    
    expect(session.getOutput()).toBe('');
    expect(session.getErrors()).toBe('');
  });

  it('should close session', async () => {
    expect(session.isSessionActive()).toBe(true);
    
    await session.close();
    
    expect(session.isSessionActive()).toBe(false);
  });
});
