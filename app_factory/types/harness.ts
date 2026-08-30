export type HarnessActivityKind =
  | "thinking"
  | "read"
  | "search"
  | "edit"
  | "write"
  | "command"
  | "inspect"
  | "tool";
export type HarnessActivityStatus = "started" | "updated" | "completed" | "failed";
export type HarnessActivity = {
  id: string;
  kind: HarnessActivityKind;
  status: HarnessActivityStatus;
  toolName?: string;
  path?: string;
  command?: string;
  summary?: string;
};
export type HarnessEvent =
  | { type: "text"; content: string; timestamp: string; stream?: "assistant" }
  | { type: "activity"; content: string; timestamp: string; activity: HarnessActivity }
  | { type: "error" | "completed"; content: string; timestamp: string };
export type HarnessSessionRef = { id: string; projectId: string; harness: "pi"; cwd: string };
export interface HarnessRuntime { createSession(projectId: string, cwd: string): Promise<HarnessSessionRef>; run(session: HarnessSessionRef, prompt: string): AsyncIterable<HarnessEvent>; cancel(session: HarnessSessionRef): Promise<void>; release(session: HarnessSessionRef): Promise<void>; }
