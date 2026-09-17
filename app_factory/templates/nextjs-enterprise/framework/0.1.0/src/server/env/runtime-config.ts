const defaultDatabaseSchema = "{{APP_SCHEMA}}";

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少运行环境变量 ${name}`);
  return value;
}

function positiveInteger(name: string, fallback: number) {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} 必须是正整数`);
  }
  return parsed;
}

export function validateDatabaseSchema(value: string) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(value)) {
    throw new Error("应用数据库 Schema 标识无效");
  }
  return value;
}

export function getDatabaseConfig() {
  return {
    databaseUrl: requiredEnvironment("DATABASE_URL"),
    databaseSchema: validateDatabaseSchema(defaultDatabaseSchema),
  };
}

export function getRuntimeConfig() {
  const authSecret = requiredEnvironment("APP_AUTH_SECRET");
  if (authSecret.length < 32) {
    throw new Error("APP_AUTH_SECRET 至少需要 32 个字符");
  }
  return {
    ...getDatabaseConfig(),
    authSecret,
    sessionTtlSeconds: positiveInteger("APP_SESSION_TTL_SECONDS", 8 * 60 * 60),
  };
}

export function getBootstrapToken() {
  const token = requiredEnvironment("ENTERPRISE_BOOTSTRAP_TOKEN");
  if (token.length < 16) {
    throw new Error("ENTERPRISE_BOOTSTRAP_TOKEN 至少需要 16 个字符");
  }
  return token;
}

export function getWorkerConfig() {
  return {
    concurrency: positiveInteger("ENTERPRISE_WORKER_CONCURRENCY", 2),
    pollMilliseconds: positiveInteger("ENTERPRISE_WORKER_POLL_MS", 500),
    retryBaseMilliseconds: positiveInteger("ENTERPRISE_JOB_RETRY_BASE_MS", 1_000),
    lockTimeoutSeconds: positiveInteger("ENTERPRISE_JOB_LOCK_TIMEOUT_SECONDS", 5 * 60),
  };
}
