import readline from 'readline';

async function exitCommand(rl: readline.Interface) {
    console.log("Exiting CLI interface...");
    rl.close();
    process.exit(0);
}

export { exitCommand };