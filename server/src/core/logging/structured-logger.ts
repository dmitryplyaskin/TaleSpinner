import type { Logger } from "../types/common";

type LogLevel = "debug" | "info" | "warn" | "error";

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ fallback: String(value) });
  }
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ?? {}),
  };
  const line = safeStringify(payload);
  const sink =
    level === "debug"
      ? console.debug
      : level === "info"
        ? console.info
        : level === "warn"
          ? console.warn
          : console.error;
  sink(line);
}

export const structuredLogger: Logger = {
  debug(message, context) {
    write("debug", message, context);
  },
  info(message, context) {
    write("info", message, context);
  },
  warn(message, context) {
    write("warn", message, context);
  },
  error(message, context) {
    write("error", message, context);
  },
};

export function logLifecycle(
  logger: Logger,
  event: string,
  context?: Record<string, unknown>
): void {
  logger.info(event, {
    event,
    ...(context ?? {}),
  });
}
