import { redactString, redactValue } from "./redact";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerContext {
  service: "web" | "worker" | "realtime";
  module: string;
}

export interface Logger {
  debug: (msg: string, meta?: Record<string, unknown>) => void;
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  child: (extra: Record<string, unknown>) => Logger;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getMinLevel(): LogLevel {
  const raw = process.env["LOG_LEVEL"]?.toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return process.env["NODE_ENV"] === "development" ? "debug" : "info";
}

function writeLog(
  level: LogLevel,
  context: LoggerContext,
  baseMeta: Record<string, unknown>,
  msg: string,
  meta?: Record<string, unknown>,
): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[getMinLevel()]) {
    return;
  }

  const combinedMeta = meta ? { ...baseMeta, ...meta } : baseMeta;
  const redactedMeta = redactValue(combinedMeta) as Record<string, unknown>;

  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: context.service,
    module: context.module,
    msg: redactString(msg),
    ...redactedMeta,
  };

  let line: string;
  try {
    line = `${JSON.stringify(payload)}\n`;
  } catch {
    line = `${JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: context.service,
      module: context.module,
      msg: redactString(msg),
      serializationError: true,
    })}\n`;
  }

  if (level === "warn" || level === "error") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export function createLogger(
  context: LoggerContext,
  baseMeta: Record<string, unknown> = {},
): Logger {
  return {
    debug: (msg, meta) => writeLog("debug", context, baseMeta, msg, meta),
    info: (msg, meta) => writeLog("info", context, baseMeta, msg, meta),
    warn: (msg, meta) => writeLog("warn", context, baseMeta, msg, meta),
    error: (msg, meta) => writeLog("error", context, baseMeta, msg, meta),
    child: (extra) => createLogger(context, { ...baseMeta, ...extra }),
  };
}
