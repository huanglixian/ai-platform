import fs from "node:fs/promises";
import path from "node:path";

const transcriptRoot = path.join(process.cwd(), "storage", "appfactory", "transcripts");

export async function appendTranscript(sessionId: string, event: unknown) {
  await fs.mkdir(transcriptRoot, { recursive: true });
  const filePath = path.join(transcriptRoot, `${sessionId}.jsonl`);
  await fs.appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
  return filePath;
}
