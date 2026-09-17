type LogLevel = "info" | "warn" | "error";

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key,
    /password|secret|token|authorization/i.test(key) ? "[REDACTED]" : redact(item),
  ]));
}

function redactContext(context: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(context).map(([key, value]) => [key, redact(value)]));
}

function write(level: LogLevel, message: string, context: Record<string, unknown> = {}) {
  const payload = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redactContext(context),
  });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}

export const logInfo = (message: string, context?: Record<string, unknown>) =>
  write("info", message, context);

export const logWarning = (message: string, context?: Record<string, unknown>) =>
  write("warn", message, context);

export const logError = (message: string, context?: Record<string, unknown>) =>
  write("error", message, context);

export function requestIdFor(request: Request) {
  return request.headers.get("x-request-id")?.slice(0, 120) || crypto.randomUUID();
}
