import readline from "readline";
import path from "path";
import fs from "fs";

import { InterfaceLogger } from "../../infrastructure/logging/Logger";

/**
 * CLI class to handle command-line interactions with the user.
 * It listens for user input and executes corresponding commands.
 * Commands are dynamically loaded from the 'commands' directory.
 * Supported commands include:
 * - ask: Interact with the agent to ask questions or give instructions.
 * - config: View and modify system configuration settings.
 * - system: View system status and resource usage.
 * - help: Display a list of available commands and their descriptions.
 * - exit: Exit the CLI interface.
 */
export class CLI {
    private rl;
    private commandList: string[];
    public logger;

    constructor() {
        this.commandList = [];
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '\nSynapse > '
        });
        this.logger = new InterfaceLogger('cli');

        fs.readdir(path.join(process.cwd(), 'src', 'interfaces', 'cli', 'commands'), (err, files) => {
            files.forEach(file => {
                this.commandList.push(file.replace('.ts', ''));
            });
        });
    }

    async start() {
        this.logger.info("CLI interface started.");
        this.rl.prompt();

        this.rl.on('line', async (line) => {
            const input = line.trim();
            const [command, ...args] = input.split(' ');

            switch (command) {
                case 'ask':
                    const { askCommand } = await import('./commands/ask');
                    await askCommand(args, this.logger);
                    break;
                case 'config':
                    const { configCommand } = await import('./commands/config');
                    await configCommand(args, this.logger);
                    break;
                case 'system':
                    const { systemCommand } = await import('./commands/system');
                    await systemCommand(args, this.logger);
                    break;

                case 'help':
                    const { helpCommand } = await import('./commands/help');
                    await helpCommand(args, this.logger);
                    break;
                case 'exit':
                    const { exitCommand } = await import('./commands/exit');
                    await exitCommand(this.rl);
                    break;
                case 'yes': break;
                case 'no': break;
                default:
                    this.logger.warn(`Unknown command: ${command}` + (this.commandList.includes(command) ? '' : ' (type "help" for a list of commands)'));
            }

            this.rl.prompt();
        });


    }
}