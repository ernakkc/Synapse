// import { startTelegram } from "./interfaces/telegram";
import { startCLI } from "./interfaces/cli";
// import { startElectron } from "./interfaces/electron";



// TEST FUNCTIONS TO SIMULATE INTERFACE STARTUP
async function startTelegram() {
    console.log("Starting Telegram interface...");
    // Simulate async initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Telegram interface started.");
}

async function startElectron() {
    console.log("Starting Electron interface...");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Electron interface started.");
}





export async function bootstrap() {
    console.log("🚀 Synapse starting...");

    await Promise.all([
        startTelegram(),
        startCLI(),
        startElectron(),
    ]);

    console.log("✅ All interfaces started");
}
