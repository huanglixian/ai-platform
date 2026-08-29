export type HarnessEvent = { type: "text" | "tool" | "error" | "completed"; content: string; timestamp: string };
export type HarnessSessionRef = { id: string; projectId: string; harness: "pi" };
export interface HarnessRuntime { createSession(projectId: string, cwd: string): Promise<HarnessSessionRef>; run(session: HarnessSessionRef, prompt: string): AsyncIterable<HarnessEvent>; cancel(session: HarnessSessionRef): Promise<void>; release(session: HarnessSessionRef): Promise<void>; }
