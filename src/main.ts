// import { startTelegram } from "./interfaces/telegram";
import { startCLI } from "./app";
// import { startElectron } from "./interfaces/electron";

import { InterfaceLogger } from "./infrastructure/logging/Logger";
const logger = new InterfaceLogger('system');

async function bootstrap() {
    logger.start("Synapse starting...");

    await Promise.all([
        // startTelegram(),
        startCLI(),
        // startElectron(),
    ]);

    logger.success("All interfaces started");
}

bootstrap().catch(err => {
    logger.error("Error during startup:", err);
    process.exit(1);
});
