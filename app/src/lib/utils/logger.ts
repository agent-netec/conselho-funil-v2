/**
 * R-3.2: Structured logging utility for API routes.
 * Outputs JSON logs that can be parsed by Vercel/Datadog/etc.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  route?: string;
  brandId?: string;
  userId?: string;
  durationMs?: number;
  error?: string;
  meta?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  });
}

export const logger = {
  info(message: string, meta?: Omit<LogEntry, 'level' | 'message'>) {
    console.log(formatLog({ level: 'info', message, ...meta }));
  },
  warn(message: string, meta?: Omit<LogEntry, 'level' | 'message'>) {
    console.warn(formatLog({ level: 'warn', message, ...meta }));
  },
  error(message: string, meta?: Omit<LogEntry, 'level' | 'message'>) {
    console.error(formatLog({ level: 'error', message, ...meta }));
  },
  debug(message: string, meta?: Omit<LogEntry, 'level' | 'message'>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog({ level: 'debug', message, ...meta }));
    }
  },
};
