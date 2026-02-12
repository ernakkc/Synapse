import { spawn } from "child_process";
import { InterfaceLogger } from "./infrastructure/logging/Logger";

const OSNAME = process.platform.toLowerCase();
const logger = new InterfaceLogger('system');

function startCLI() {
	if (OSNAME === "darwin") {
		spawn("osascript", ["-e","tell application \"Terminal\" to do script \"cd '" + process.cwd() + "' && npm run cli\""]);
	} else if (OSNAME === "win32") {
		spawn("cmd", ["/c", "start", "npm run cli"]);
	} else if (OSNAME === "linux") {
		spawn("gnome-terminal", ["--", "npm", "run", "cli"]);
	}
	logger.info("CLI interface launched in a new terminal window.");
}

function startTelegram() {
	if (OSNAME === "darwin") {
		spawn("osascript", ["-e","tell application \"Terminal\" to do script \"cd '" + process.cwd() + "' && npm run telegram\""]);
	} else if (OSNAME === "win32") {
		spawn("cmd", ["/c", "start", "npm run telegram"]);
	} else if (OSNAME === "linux") {
		spawn("gnome-terminal", ["--", "npm", "run", "telegram"]);
	}
	logger.info("Telegram interface launched in a new terminal window.");
}

function startElectron() {
	if (OSNAME === "darwin") {
		spawn("osascript", ["-e","tell application \"Terminal\" to do script \"cd '" + process.cwd() + "' && npm run electron\""]);
	} else if (OSNAME === "win32") {
		spawn("cmd", ["/c", "start", "npm run electron"]);
	} else if (OSNAME === "linux") {
		spawn("gnome-terminal", ["--", "npm", "run", "electron"]);
	}
	logger.info("Electron interface launched in a new terminal window.");
}

export { startCLI, startTelegram, startElectron };