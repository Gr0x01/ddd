/**
 * Simple structured logger for enrichment system
 * Provides consistent logging with context and severity levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  operation?: string;
  [key: string]: any;
}

class Logger {
  private minLevel: LogLevel = 'info';

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);

    let contextStr = '';
    if (context) {
      const { component, operation, ...rest } = context;
      const parts: string[] = [];

      if (component) parts.push(`component=${component}`);
      if (operation) parts.push(`operation=${operation}`);

      if (Object.keys(rest).length > 0) {
        parts.push(JSON.stringify(rest));
      }

      if (parts.length > 0) {
        contextStr = ` [${parts.join(', ')}]`;
      }
    }

    return `${timestamp} ${levelStr}${contextStr} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory for component-specific loggers
export function createLogger(component: string) {
  return {
    debug: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.debug(message, { component, ...context }),
    info: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.info(message, { component, ...context }),
    warn: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.warn(message, { component, ...context }),
    error: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.error(message, { component, ...context }),
  };
}
