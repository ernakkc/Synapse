import userConfigJson from "./user_config.json";
import dotenv from "dotenv";
dotenv.config();


function getEnv(key: string): string {
    return process.env[key] || "";
}



const DEFAULT_CONFIG = {
    TELEGRAM: {
        BOT_TOKEN: "",
        ADMIN_ID: "",
    },
    OLLAMA: {
        MODEL: "llama3",
        BASE_URL: "http://localhost:11434",
    },
    AI_SETTINGS: {
        MIN_CONFIDENCE_THRESHOLD: 0.7,
        TEMPERATURE: 0.7
    }
};


export const CONFIG = {
    TELEGRAM: {
        BOT_TOKEN: getEnv("TELEGRAM_BOT_TOKEN") || DEFAULT_CONFIG.TELEGRAM.BOT_TOKEN,
        ADMIN_ID: getEnv("ADMIN_ID") || DEFAULT_CONFIG.TELEGRAM.ADMIN_ID,
    },
    OLLAMA: {
        MODEL: userConfigJson.OLLAMA?.MODEL || DEFAULT_CONFIG.OLLAMA.MODEL,
        BASE_URL: userConfigJson.OLLAMA?.BASE_URL || DEFAULT_CONFIG.OLLAMA.BASE_URL,
    },
    AI_SETTINGS: {
        MIN_CONFIDENCE_THRESHOLD: userConfigJson.AI_SETTINGS?.MIN_CONFIDENCE_THRESHOLD || DEFAULT_CONFIG.AI_SETTINGS.MIN_CONFIDENCE_THRESHOLD,
        TEMPERATURE: userConfigJson.AI_SETTINGS?.TEMPERATURE || DEFAULT_CONFIG.AI_SETTINGS.TEMPERATURE
    }
};