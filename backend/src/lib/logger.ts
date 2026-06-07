import { config } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LEVEL_RANK[config.LOG_LEVEL] ?? LEVEL_RANK.info;

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= currentLevel;
}

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase().padEnd(5);
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${levelStr} ${message}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    if (shouldLog('debug')) console.log(formatMessage('debug', message, meta));
  },

  info(message: string, meta?: unknown): void {
    if (shouldLog('info')) console.log(formatMessage('info', message, meta));
  },

  warn(message: string, meta?: unknown): void {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message, meta));
  },

  error(message: string, error?: unknown): void {
    if (shouldLog('error')) {
      const meta = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
      console.error(formatMessage('error', message, meta));
    }
  },
};
