import { CLI } from "./CLI";


export async function startCLI() {
    const cli = new CLI();
    await cli.start();
}
