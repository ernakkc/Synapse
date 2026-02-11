import readline from "readline";
import path from "path";
import fs from "fs";

import { Logger } from "../../infrastructure/logging/Logger";

export class CLI {
    private rl;
    private commandList: string[]; 

    constructor() {
        this.commandList = [];
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'Synapse > '
        });

        fs.readdir(path.join(process.cwd(), 'src', 'interfaces', 'cli', 'commands'), (err, files) => {
            files.forEach(file => {
                this.commandList.push(file.replace('.ts', ''));
            });
        });
    }

    async start() {
        Logger.info("CLI interface started.");
        this.rl.prompt();

        this.rl.on('line', async (line) => {
            const input = line.trim();
            const [command, ...args] = input.split(' ');

            switch (command) {
                case 'ask': 
                    // const { askCommand } = await import('./commands/ask');
                    // await askCommand(args);
                    break;
                case 'config':
                    // const { configCommand } = await import('./commands/config');
                    // await configCommand(args);
                    break;
                case 'system':
                    // const { systemCommand } = await import('./commands/system');
                    // await systemCommand(args);
                    break;
                case 'exit':
                    // const { exitCommand } = await import('./commands/exit');
                    // await exitCommand(args);
                    break;
                default:
                    console.log(`Unknown command: ${command}`);
                    console.log(`Available commands: ${this.commandList.join(', ')}`);
            }

            this.rl.prompt();
        });
    }
}