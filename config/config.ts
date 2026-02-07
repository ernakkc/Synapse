import userConfigJson from './user_config.json';
import dotenv from 'dotenv';
dotenv.config();


const DEFAULT_CONFIG = {
    OLLAMA : {
        OLLAMA_MODEL: "llama3",
        OLLAMA_HOST: "http://localhost:11434",
    },
    AI_CONFIG: {
        MIN_CONFIDENCE_THRESHOLD: 0.7,
    },
}

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ CONFIG HATASI: ${key} .env dosyasında bulunamadı!`);
  }
  return value;
};


export const CONFIG = {
    OLLAMA: {
        MODEL: userConfigJson.OLLAMA?.MODEL || DEFAULT_CONFIG.OLLAMA.OLLAMA_MODEL,
        HOST: userConfigJson.OLLAMA?.HOST || DEFAULT_CONFIG.OLLAMA.OLLAMA_HOST,
    },
    AI_CONFIG: {
        MIN_CONFIDENCE_THRESHOLD: userConfigJson.AI_CONFIG?.MIN_CONFIDENCE_THRESHOLD || DEFAULT_CONFIG.AI_CONFIG.MIN_CONFIDENCE_THRESHOLD,
    },
    TELEGRAM: {
        BOT_TOKEN: getEnv('TELEGRAM_BOT_TOKEN'),
        ADMIN_ID: getEnv('ADMIN_ID'),
    }
}




