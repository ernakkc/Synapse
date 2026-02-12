import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface tipleri
export type InterfaceType = 'cli' | 'electron' | 'telegram' | 'system';

// Logger cache
const loggerInstances: Map<InterfaceType, winston.Logger> = new Map();

// Interface için log klasörü oluştur
function createLogDirectory(interfaceType: InterfaceType): string {
  const logsDir = path.join(process.cwd(), 'logs', interfaceType);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

// Renkli log formatı (konsol için)
function createColoredFormat(interfaceType: InterfaceType) {
  return winston.format.combine(
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

      const interfaceColors: Record<InterfaceType, string> = {
        cli: '\x1b[32m',      // Yeşil
        electron: '\x1b[34m', // Mavi
        telegram: '\x1b[36m', // Cyan
        system: '\x1b[37m'    // Beyaz
      };

      const color = colors[level] || colors.reset;
      const interfaceColor = interfaceColors[interfaceType] || colors.reset;
      const icons: Record<string, string> = {
        error: '❌',
        warn: '⚠️ ',
        info: 'ℹ️ ',
        debug: '🔍'
      };
      const icon = icons[level] || '📝';

      const logMessage = stack || message;
      return `${color}${icon} [${timestamp}] ${interfaceColor}[${interfaceType.toUpperCase()}]${colors.reset} ${level.toUpperCase().padEnd(5)}${colors.reset} | ${logMessage}`;
    })
  );
}

// Dosya formatı (renkler olmadan)
function createFileFormat(interfaceType: InterfaceType) {
  return winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format((info) => {
      info.interface = interfaceType;
      return info;
    })()
  );
}

// Interface için logger oluştur
function createLogger(interfaceType: InterfaceType): winston.Logger {
  const logsDir = createLogDirectory(interfaceType);
  const fileFormat = createFileFormat(interfaceType);
  const coloredFormat = createColoredFormat(interfaceType);

  const logger = winston.createLogger({
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
    logger.level = 'debug';
  }

  return logger;
}

// Logger instance al veya oluştur
export function getLogger(interfaceType: InterfaceType): winston.Logger {
  if (!loggerInstances.has(interfaceType)) {
    loggerInstances.set(interfaceType, createLogger(interfaceType));
  }
  return loggerInstances.get(interfaceType)!;
}

// Varsayılan logger (system)
export const Logger = getLogger('system');

// Global hata yakalayıcı
process.on('uncaughtException', (error: Error) => {
  Logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  Logger.error('Unhandled Rejection:', reason);
});

// Logger wrapper sınıfı
export class InterfaceLogger {
  private logger: winston.Logger;
  
  constructor(private interfaceType: InterfaceType) {
    this.logger = getLogger(interfaceType);
  }

  info(message: string, ...meta: any[]) {
    this.logger.info(message, ...meta);
  }

  error(message: string, error?: any) {
    if (error?.stack) {
      this.logger.error(`${message}\n${error.stack}`);
    } else {
      this.logger.error(message, error);
    }
  }

  warn(message: string, ...meta: any[]) {
    this.logger.warn(message, ...meta);
  }

  debug(message: string, ...meta: any[]) {
    this.logger.debug(message, ...meta);
  }

  // Özel metodlar
  success(message: string) {
    this.logger.info(`✅ ${message}`);
  }

  start(message: string) {
    this.logger.info(`🚀 ${message}`);
  }

  complete(message: string) {
    this.logger.info(`✨ ${message}`);
  }

  // Performans ölçümü
  time(label: string) {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        this.logger.debug(`⏱️  ${label}: ${duration}ms`);
      }
    };
  }
}

// Varsayılan logger instance (geriye dönük uyumluluk için)
export const logger = new InterfaceLogger('system');
