import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logs klasörünü oluştur
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Renkli log formatı (konsol için)
const coloredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }: any) => {
    const colors: Record<string, string> = {
      error: '\x1b[31m', // Kırmızı
      warn: '\x1b[33m',  // Sarı
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[35m', // Magenta
      reset: '\x1b[0m'
    };

    const color = colors[level] || colors.reset;
    const icons: Record<string, string> = {
      error: '❌',
      warn: '⚠️ ',
      info: 'ℹ️ ',
      debug: '🔍'
    };
    const icon = icons[level] || '📝';

    const logMessage = stack || message;
    return `${color}${icon} [${timestamp}] ${level.toUpperCase().padEnd(5)}${colors.reset} | ${logMessage}`;
  })
);

// Dosya formatı (renkler olmadan)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Logger instance
export const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Konsol çıktısı (renkli)
    new winston.transports.Console({
      format: coloredFormat
    }),
    
    // Tüm loglar
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Sadece hatalar
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Development modunda debug log ekle
if (process.env.NODE_ENV !== 'production') {
  Logger.level = 'debug';
}

// Global hata yakalayıcı
process.on('uncaughtException', (error: Error) => {
  Logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  Logger.error('Unhandled Rejection:', reason);
});

// Yardımcı metodlar
export const logger = {
  info: (message: string, ...meta: any[]) => Logger.info(message, ...meta),
  error: (message: string, error?: any) => {
    if (error?.stack) {
      Logger.error(`${message}\n${error.stack}`);
    } else {
      Logger.error(message, error);
    }
  },
  warn: (message: string, ...meta: any[]) => Logger.warn(message, ...meta),
  debug: (message: string, ...meta: any[]) => Logger.debug(message, ...meta),
  
  // Özel metodlar
  success: (message: string) => Logger.info(`✅ ${message}`),
  start: (message: string) => Logger.info(`🚀 ${message}`),
  complete: (message: string) => Logger.info(`✨ ${message}`),
  
  // Performans ölçümü
  time: (label: string) => {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        Logger.debug(`⏱️  ${label}: ${duration}ms`);
      }
    };
  }
};
