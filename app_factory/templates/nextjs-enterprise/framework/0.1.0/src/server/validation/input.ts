import { badRequest } from "../errors/app-error.ts";

export async function readJson(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    throw badRequest("请求体必须是 JSON");
  }
}

export function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest("请求体必须是对象");
  }
  return value as Record<string, unknown>;
}

export function stringField(
  value: unknown,
  field: string,
  { min = 1, max = 2_000, pattern }: { min?: number; max?: number; pattern?: RegExp } = {},
) {
  if (typeof value !== "string") throw badRequest(`${field} 必须是文本`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw badRequest(`${field} 长度必须在 ${min} 到 ${max} 个字符之间`);
  }
  if (pattern && !pattern.test(normalized)) throw badRequest(`${field} 格式不正确`);
  return normalized;
}

export function optionalStringField(
  value: unknown,
  field: string,
  options: { max?: number } = {},
) {
  if (value === undefined || value === null || value === "") return null;
  return stringField(value, field, { min: 1, max: options.max ?? 2_000 });
}

export function stringArrayField(
  value: unknown,
  field: string,
  { min = 0, max = 100 }: { min?: number; max?: number } = {},
) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw badRequest(`${field} 必须是包含 ${min} 到 ${max} 项的数组`);
  }
  return value.map((item, index) => stringField(item, `${field}[${index}]`, { min: 1, max: 160 }));
}
