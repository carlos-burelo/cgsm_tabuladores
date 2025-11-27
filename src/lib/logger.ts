import { config } from "./config";

type LogLevel = "debug" | "info" | "warn" | "error";

const logLevelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = logLevelPriority[config.logging.level];

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  debug(message: string, data?: unknown): void {
    if (logLevelPriority.debug >= currentLogLevel) {
      console.debug(this.formatMessage("debug", message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (logLevelPriority.info >= currentLogLevel) {
      console.log(this.formatMessage("info", message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (logLevelPriority.warn >= currentLogLevel) {
      console.warn(this.formatMessage("warn", message, data));
    }
  }

  error(message: string, error?: unknown): void {
    if (logLevelPriority.error >= currentLogLevel) {
      const data = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      console.error(this.formatMessage("error", message, data));
    }
  }
}

export const logger = new Logger();
