import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const options = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
function derive(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(24).toString("hex");
  return `scrypt:131072:8:1:${salt}:${(await derive(password, salt)).toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, n, r, p, salt, hash] = encoded.split(":");
  if (
    algorithm !== "scrypt" ||
    n !== "131072" ||
    r !== "8" ||
    p !== "1" ||
    !/^[a-f0-9]{48}$/.test(salt ?? "") ||
    !/^[a-f0-9]{128}$/.test(hash ?? "")
  )
    return false;
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
