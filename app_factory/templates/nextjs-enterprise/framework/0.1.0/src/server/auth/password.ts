import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export function validUsername(value: string) {
  return /^[a-zA-Z0-9._-]{3,80}$/.test(value);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString("base64url")}`;
}

export async function passwordMatches(password: string, encoded: string) {
  const [salt, expected] = encoded.split(":");
  if (!salt || !expected) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  const actualValue = Buffer.from(actual.toString("base64url"));
  const expectedValue = Buffer.from(expected);
  return actualValue.length === expectedValue.length && timingSafeEqual(actualValue, expectedValue);
}
