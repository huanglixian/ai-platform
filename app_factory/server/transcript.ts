import fs from "node:fs/promises";
import path from "node:path";
import type { HarnessActivity } from "@/app_factory/types/harness";

const transcriptRoot = path.join(process.cwd(), "storage", "appfactory", "transcripts");

export type TranscriptEvent = {
  type: string;
  content: string;
  timestamp?: string;
  runId?: string;
  sequence?: number;
  stream?: "assistant";
  activity?: HarnessActivity;
};

export function parseTranscript(content: string): TranscriptEvent[] {
  return content
    .split("\n")
    .map((line) => {
      try {
        const event = JSON.parse(line) as Partial<TranscriptEvent>;
        return typeof event.type === "string" && typeof event.content === "string"
          ? (event as TranscriptEvent)
          : null;
      } catch {
        return null;
      }
    })
    .filter((event): event is TranscriptEvent => event !== null);
}

export async function appendTranscript(sessionId: string, event: unknown) {
  await fs.mkdir(transcriptRoot, { recursive: true });
  const filePath = path.join(transcriptRoot, `${sessionId}.jsonl`);
  await fs.appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
  return filePath;
}

export async function readTranscript(transcriptPath: string | null | undefined) {
  if (!transcriptPath) return [];
  const root = path.resolve(transcriptRoot);
  const filePath = path.resolve(transcriptPath);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Transcript path is outside AppFactory storage");
  }
  try {
    return parseTranscript(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
