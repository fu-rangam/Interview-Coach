export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: any;
}

class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error =
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error;
    }

    // In production, this would go to a log aggregator (e.g., Datadog, Splunk, CloudWatch).
    // For now, we print JSON stringified to console for easier parsing by log collectors.
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>, error?: any) {
    this.log('warn', message, context, error);
  }

  error(message: string, error?: any, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  debug(message: string, context?: Record<string, any>) {
    // Ideally usage of debug logs is controlled by an env var or log level setting
    if (import.meta.env.DEV) {
      this.log('debug', message, context);
    }
  }
}

export const logger = new Logger();
