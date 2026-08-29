import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import type { HarnessEvent, HarnessRuntime, HarnessSessionRef } from "@/app_factory/types/harness";

export class PiHarnessRuntime implements HarnessRuntime {
  private readonly children = new Map<string, ChildProcess>();
  async createSession(projectId: string, cwd: string) { return { id: `pi-${crypto.randomUUID()}`, projectId, harness: "pi" as const, cwd }; }
  async *run(session: HarnessSessionRef, prompt: string): AsyncGenerator<HarnessEvent> {
    const piBin = path.join(process.cwd(), "node_modules", ".bin", "pi");
    const skillPath = path.join(process.cwd(), "app_factory", "skills", "nextjs-build");
    const child = spawn(piBin, ["--print", prompt, "--session-id", session.id, "--session-dir", path.join(process.cwd(), "storage", "appfactory", "pi-sessions"), "--skill", skillPath], { cwd: session.cwd, env: { ...process.env } });
    this.children.set(session.id, child);
    try {
      const queue: HarnessEvent[] = [];
      let done = false;
      let wake: (() => void) | undefined;
      const push = (event: HarnessEvent) => { queue.push(event); wake?.(); wake = undefined; };
      child.stdout?.on("data", (chunk) => push({ type: "text", content: chunk.toString(), timestamp: new Date().toISOString() }));
      child.stderr?.on("data", (chunk) => push({ type: "error", content: chunk.toString(), timestamp: new Date().toISOString() }));
      const completion = new Promise<number | null>((resolve, reject) => { child.once("error", reject); child.once("close", (code) => { done = true; wake?.(); resolve(code); }); });
      while (!done || queue.length) { if (!queue.length) await new Promise<void>((resolve) => { wake = resolve; }); while (queue.length) yield queue.shift()!; }
      const code = await completion;
      if (code === 0) yield { type: "completed", content: `${session.id} completed`, timestamp: new Date().toISOString() };
      else yield { type: "error", content: `Pi 进程退出（code=${code ?? "unknown"}）`, timestamp: new Date().toISOString() };
    } finally { this.children.delete(session.id); }
  }
  async cancel(session: HarnessSessionRef) { this.children.get(session.id)?.kill("SIGTERM"); }
  async release(session: HarnessSessionRef) { await this.cancel(session); }
}

export const piHarnessRuntime = new PiHarnessRuntime();
