import { vi } from 'vitest';

/**
 * Mock LLM Provider for testing
 */
export class MockLLMProvider {
  private responses: Map<string, any>;

  constructor() {
    this.responses = new Map();
  }

  /**
   * Set a mock response for a specific prompt pattern
   */
  setResponse(pattern: string, response: any) {
    this.responses.set(pattern, response);
  }

  /**
   * Mock generate method
   */
  async generate(prompt: string): Promise<any> {
    // Find matching response
    for (const [pattern, response] of this.responses.entries()) {
      if (prompt.includes(pattern)) {
        return response;
      }
    }

    // Default response
    return {
      type: 'CHAT',
      intent: 'GREETING',
      confidence: 0.9,
      risk_level: 'LOW',
      tool_suggestion: 'none',
      parameters: {},
      context: {
        user_text: prompt.slice(0, 100),
        language: 'en'
      }
    };
  }
}

/**
 * Mock CommandRunner for testing
 */
export class MockCommandRunner {
  private commandResults: Map<string, any>;
  private executedCommands: string[];

  constructor() {
    this.commandResults = new Map();
    this.executedCommands = [];
  }

  /**
   * Set result for a specific command
   */
  setCommandResult(command: string, result: any) {
    this.commandResults.set(command, result);
  }

  /**
   * Get history of executed commands
   */
  getExecutedCommands(): string[] {
    return [...this.executedCommands];
  }

  /**
   * Mock run method
   */
  async run(command: string): Promise<any> {
    this.executedCommands.push(command);

    // Return preset result if available
    if (this.commandResults.has(command)) {
      return this.commandResults.get(command);
    }

    // Default success response
    return {
      success: true,
      stdout: `Mock output for: ${command}`,
      stderr: '',
      exitCode: 0,
      executionTime: 10
    };
  }

  /**
   * Mock runSequence method
   */
  async runSequence(commands: string[]): Promise<any[]> {
    const results = [];
    for (const cmd of commands) {
      results.push(await this.run(cmd));
    }
    return results;
  }

  /**
   * Mock runParallel method
   */
  async runParallel(commands: string[]): Promise<any[]> {
    return Promise.all(commands.map(cmd => this.run(cmd)));
  }

  /**
   * Mock createSession method
   */
  async createSession(sessionId: string): Promise<any> {
    return { id: sessionId, active: true };
  }

  /**
   * Mock closeSession method
   */
  async closeSession(sessionId: string): Promise<void> {
    // No-op
  }

  /**
   * Mock getActiveSessions method
   */
  getActiveSessions(): string[] {
    return [];
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executedCommands = [];
  }
}

/**
 * Mock AnalysisResult factory
 */
export function createMockAnalysisResult(overrides: Partial<any> = {}): any {
  return {
    type: 'CHAT',
    intent: 'GREETING',
    confidence: 0.9,
    risk_level: 'LOW',
    tool_suggestion: 'none',
    parameters: {},
    context: {
      user_text: 'Test message',
      language: 'en',
      source: 'cli'
    },
    request_id: 'test-' + Date.now(),
    ...overrides
  };
}

/**
 * Mock PlanningResult factory
 */
export function createMockPlanningResult(overrides: Partial<any> = {}): any {
  return {
    steps: [
      {
        action: 'TEST_ACTION',
        description: 'Test action'
      }
    ],
    estimated_time: '1 second',
    requires_approval: false,
    ...overrides
  };
}

/**
 * Mock Message factory
 */
export function createMockMessage(content: string, overrides: Partial<any> = {}): any {
  return {
    id: 'msg-' + Date.now(),
    content,
    timestamp: Date.now(),
    source: 'cli',
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    },
    ...overrides
  };
}

/**
 * Mock CommandResult factory
 */
export function createMockCommandResult(success: boolean = true, overrides: Partial<any> = {}): any {
  return {
    success,
    stdout: success ? 'Command output' : '',
    stderr: success ? '' : 'Command error',
    exitCode: success ? 0 : 1,
    executionTime: 100,
    ...overrides
  };
}

/**
 * Create a spy with default implementation
 */
export function createSpyWithDefault<T extends (...args: any[]) => any>(
  defaultImpl: T
) {
  return vi.fn(defaultImpl);
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Create a temporary test file
 */
export async function createTempFile(
  filename: string,
  content: string
): Promise<string> {
  const path = `/tmp/test-${Date.now()}-${filename}`;
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  await execAsync(`echo "${content}" > ${path}`);
  return path;
}

/**
 * Clean up temporary test file
 */
export async function cleanupTempFile(path: string): Promise<void> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  await execAsync(`rm -f ${path}`);
}

/**
 * Mock logger for testing
 */
export const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  success: vi.fn(),
  start: vi.fn(),
  complete: vi.fn()
};

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  Object.values(mockLogger).forEach(fn => fn.mockClear());
}
