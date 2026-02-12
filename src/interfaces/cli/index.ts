import { CLI } from "./CLI";


export async function startCLI() {
    const cli = new CLI();
    await cli.start();
}

startCLI().catch(err => {
    console.error("Error starting CLI interface:", err);
    process.exit(1);
});
