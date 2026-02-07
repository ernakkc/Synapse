import winston from 'winston';
import path from 'path';

// Log formatını belirle
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

export const Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Konsola yaz
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            logFormat
        )
    }),
    // Dosyaya yaz
    new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'app.log') 
    })
  ]
});