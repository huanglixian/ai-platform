import fs from "node:fs/promises";
import path from "node:path";

const piSessionRoot = path.join(
  process.cwd(),
  "storage",
  "appfactory",
  "pi-sessions",
);

export async function piSessionExists(sessionId: string) {
  let names: string[];
  try {
    names = await fs.readdir(piSessionRoot);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }

  for (const name of names) {
    if (!name.endsWith(".jsonl")) continue;
    const file = await fs.open(path.join(piSessionRoot, name), "r");
    try {
      const buffer = Buffer.alloc(4096);
      const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
      const firstLine = buffer.subarray(0, bytesRead).toString("utf8").split(/\r?\n/, 1)[0];
      try {
        const header = JSON.parse(firstLine) as { type?: string; id?: string };
        if (header.type === "session" && header.id === sessionId) return true;
      } catch {
        // 忽略损坏或非 Pi 会话文件，继续检查其他会话。
      }
    } finally {
      await file.close();
    }
  }
  return false;
}
