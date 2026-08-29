import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import type { HarnessEvent, HarnessRuntime, HarnessSessionRef } from "@/app_factory/types/harness";

export class PiHarnessRuntime implements HarnessRuntime {
  private readonly children = new Map<string, ChildProcess>();
  async createSession(projectId: string, cwd: string) { return { id: `pi-${crypto.randomUUID()}`, projectId, harness: "pi" as const, cwd }; }
  async *run(session: HarnessSessionRef, prompt: string): AsyncGenerator<HarnessEvent> {
    // Next standalone 进程不一定把项目 env 文件回写到子进程环境，启动 Pi 前显式加载一次。
    loadEnvConfig(process.cwd());
    const piBin = path.join(process.cwd(), "node_modules", ".bin", "pi");
    const skillPath = path.join(process.cwd(), "app_factory", "skills", "nextjs-build");
    const provider = process.env.APPFACTORY_PI_PROVIDER?.trim() || (process.env.DEEPSEEK_API_KEY ? "deepseek" : "");
    const model = process.env.APPFACTORY_PI_MODEL?.trim() || (provider === "deepseek" ? (process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat") : "");
    const apiKey = process.env.APPFACTORY_PI_API_KEY?.trim() || (provider === "deepseek" ? process.env.DEEPSEEK_API_KEY?.trim() : "");
    const args = ["--print", prompt, "--approve", "--session-id", session.id, "--session-dir", path.join(process.cwd(), "storage", "appfactory", "pi-sessions"), "--skill", skillPath];
    if (provider) args.unshift("--provider", provider);
    if (model) args.unshift("--model", model);
    if (apiKey) args.unshift("--api-key", apiKey);
    const child = spawn(piBin, args, { cwd: session.cwd, env: { ...process.env }, stdio: ["ignore", "pipe", "pipe"] });
    this.children.set(session.id, child);
    try {
      const queue: HarnessEvent[] = [];
      let done = false;
      let wake: (() => void) | undefined;
      const push = (event: HarnessEvent) => { queue.push(event); wake?.(); wake = undefined; };
      child.stdout?.on("data", (chunk) => push({ type: "text", content: chunk.toString(), timestamp: new Date().toISOString() }));
      // Pi 会把正常启动提示（例如首次创建会话）写入 stderr；只有非零退出才视为执行失败。
      child.stderr?.on("data", (chunk) => push({ type: "text", content: chunk.toString(), timestamp: new Date().toISOString() }));
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
