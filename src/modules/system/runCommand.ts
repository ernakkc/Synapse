import { spawn, exec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Command execution result
 */
export interface CommandResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    executionTime: number;
}

/**
 * Command options for execution
 */
export interface CommandOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeout?: number;
    shell?: string;
    encoding?: BufferEncoding;
}

/**
 * Terminal session for interactive command execution
 */
export class TerminalSession {
    private process: ChildProcess | null = null;
    private shell: string;
    private cwd: string;
    private env: NodeJS.ProcessEnv;
    private isActive: boolean = false;
    private outputBuffer: string[] = [];
    private errorBuffer: string[] = [];
    private commandHistory: string[] = [];

    constructor(options?: CommandOptions) {
        this.shell = options?.shell || this.getDefaultShell();
        this.cwd = options?.cwd || process.cwd();
        this.env = { ...process.env, ...options?.env };
    }

    /**
     * Get default shell based on platform
     */
    private getDefaultShell(): string {
        const platform = os.platform();
        switch (platform) {
            case 'win32':
                return process.env.COMSPEC || 'cmd.exe';
            case 'darwin':
            case 'linux':
                return process.env.SHELL || '/bin/bash';
            default:
                return '/bin/sh';
        }
    }

    /**
     * Open a new terminal session
     */
    async open(): Promise<void> {
        if (this.isActive) {
            throw new Error('Terminal session is already active');
        }

        return new Promise((resolve, reject) => {
            this.process = spawn(this.shell, [], {
                cwd: this.cwd,
                env: this.env,
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.process.stdout?.on('data', (data) => {
                const output = data.toString();
                this.outputBuffer.push(output);
            });

            this.process.stderr?.on('data', (data) => {
                const error = data.toString();
                this.errorBuffer.push(error);
            });

            this.process.on('error', (error) => {
                this.isActive = false;
                reject(error);
            });

            this.process.on('spawn', () => {
                this.isActive = true;
                resolve();
            });

            this.process.on('exit', (code) => {
                this.isActive = false;
            });
        });
    }

    /**
     * Execute a command in the terminal session
     */
    async execute(command: string, timeout?: number): Promise<CommandResult> {
        if (!this.isActive || !this.process) {
            throw new Error('Terminal session is not active');
        }

        const startTime = Date.now();
        this.commandHistory.push(command);

        // Clear buffers
        this.outputBuffer = [];
        this.errorBuffer = [];

        return new Promise((resolve, reject) => {
            const timer = timeout ? setTimeout(() => {
                reject(new Error(`Command timeout after ${timeout}ms`));
            }, timeout) : null;

            // Write command to stdin
            this.process!.stdin?.write(command + '\n');

            // Wait for command completion (simplified - you may want to add better detection)
            setTimeout(() => {
                if (timer) clearTimeout(timer);

                const result: CommandResult = {
                    success: this.errorBuffer.length === 0,
                    stdout: this.outputBuffer.join(''),
                    stderr: this.errorBuffer.join(''),
                    exitCode: 0,
                    executionTime: Date.now() - startTime
                };

                resolve(result);
            }, 1000); // Basic wait - could be improved with prompt detection
        });
    }

    /**
     * Change working directory
     */
    async changeDirectory(path: string): Promise<void> {
        const result = await this.execute(`cd ${path}`);
        if (result.success) {
            this.cwd = path;
        }
    }

    /**
     * Get command history
     */
    getHistory(): string[] {
        return [...this.commandHistory];
    }

    /**
     * Get current output buffer
     */
    getOutput(): string {
        return this.outputBuffer.join('');
    }

    /**
     * Get error buffer
     */
    getErrors(): string {
        return this.errorBuffer.join('');
    }

    /**
     * Clear output buffers
     */
    clearBuffers(): void {
        this.outputBuffer = [];
        this.errorBuffer = [];
    }

    /**
     * Check if session is active
     */
    isSessionActive(): boolean {
        return this.isActive;
    }

    /**
     * Close the terminal session
     */
    async close(): Promise<void> {
        if (this.process && this.isActive) {
            return new Promise((resolve) => {
                this.process!.on('exit', () => {
                    this.isActive = false;
                    resolve();
                });

                // Send exit command
                this.process!.stdin?.write('exit\n');

                // Force kill after timeout
                setTimeout(() => {
                    if (this.isActive) {
                        this.process?.kill('SIGTERM');
                    }
                }, 3000);
            });
        }
    }
}

/**
 * Command Runner - Main class for executing system commands
 */
export class CommandRunner {
    private sessions: Map<string, TerminalSession> = new Map();
    private defaultOptions: CommandOptions;

    constructor(options?: CommandOptions) {
        this.defaultOptions = options || {};
    }

    /**
     * Execute a single command (simple, non-interactive)
     */
    async run(command: string, options?: CommandOptions): Promise<CommandResult> {
        const startTime = Date.now();
        const mergedOptions = { ...this.defaultOptions, ...options };

        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: mergedOptions.cwd,
                env: mergedOptions.env,
                timeout: mergedOptions.timeout,
                shell: mergedOptions.shell,
                encoding: mergedOptions.encoding || 'utf8'
            });

            return {
                success: true,
                stdout: stdout,
                stderr: stderr,
                exitCode: 0,
                executionTime: Date.now() - startTime
            };
        } catch (error: any) {
            return {
                success: false,
                stdout: error.stdout || '',
                stderr: error.stderr || error.message,
                exitCode: error.code || 1,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Execute multiple commands in sequence
     */
    async runSequence(commands: string[], options?: CommandOptions): Promise<CommandResult[]> {
        const results: CommandResult[] = [];

        for (const command of commands) {
            const result = await this.run(command, options);
            results.push(result);

            // Stop on first failure
            if (!result.success) {
                break;
            }
        }

        return results;
    }

    /**
     * Execute multiple commands in parallel
     */
    async runParallel(commands: string[], options?: CommandOptions): Promise<CommandResult[]> {
        const promises = commands.map(command => this.run(command, options));
        return Promise.all(promises);
    }

    /**
     * Create a new terminal session
     */
    async createSession(sessionId: string, options?: CommandOptions): Promise<TerminalSession> {
        if (this.sessions.has(sessionId)) {
            throw new Error(`Session '${sessionId}' already exists`);
        }

        const mergedOptions = { ...this.defaultOptions, ...options };
        const session = new TerminalSession(mergedOptions);
        
        await session.open();
        this.sessions.set(sessionId, session);

        return session;
    }

    /**
     * Get an existing session
     */
    getSession(sessionId: string): TerminalSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Execute command in a specific session
     */
    async runInSession(sessionId: string, command: string, timeout?: number): Promise<CommandResult> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session '${sessionId}' not found`);
        }

        return session.execute(command, timeout);
    }

    /**
     * Close a specific session
     */
    async closeSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
            await session.close();
            this.sessions.delete(sessionId);
        }
    }

    /**
     * Close all sessions
     */
    async closeAllSessions(): Promise<void> {
        const closePromises = Array.from(this.sessions.keys()).map(id => 
            this.closeSession(id)
        );
        await Promise.all(closePromises);
    }

    /**
     * Get list of active sessions
     */
    getActiveSessions(): string[] {
        return Array.from(this.sessions.keys()).filter(id => {
            const session = this.sessions.get(id);
            return session?.isSessionActive();
        });
    }

    /**
     * Execute commands with retry logic
     */
    async runWithRetry(
        command: string,
        options?: CommandOptions & { maxRetries?: number; retryDelay?: number }
    ): Promise<CommandResult> {
        const maxRetries = options?.maxRetries || 3;
        const retryDelay = options?.retryDelay || 1000;
        let lastResult: CommandResult | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            lastResult = await this.run(command, options);

            if (lastResult.success) {
                return lastResult;
            }

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        return lastResult!;
    }

    /**
     * Check if a command exists in the system
     */
    async commandExists(command: string): Promise<boolean> {
        const checkCmd = os.platform() === 'win32' 
            ? `where ${command}` 
            : `which ${command}`;

        const result = await this.run(checkCmd);
        return result.success && result.stdout.trim().length > 0;
    }

    /**
     * Get system information
     */
    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            hostname: os.hostname(),
            homedir: os.homedir(),
            tmpdir: os.tmpdir(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem()
        };
    }
}

/**
 * Create a default command runner instance
 */
export const commandRunner = new CommandRunner();

/**
 * Quick execute function
 */
export async function executeCommand(command: string, options?: CommandOptions): Promise<CommandResult> {
    return commandRunner.run(command, options);
}
