import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { normalizePiEvent } from "@/app_factory/features/pi-events";
import { ensurePiAgentConfig } from "@/app_factory/server/pi-agent-config";
import {
  getModelApiKey,
  getModelConfigurationError,
  getModelProfile,
} from "@/app_factory/server/model-profiles";
import type { HarnessEvent, HarnessRunOptions, HarnessRuntime, HarnessSessionRef } from "@/app_factory/types/harness";

function piEnvironment(options: HarnessRunOptions): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  delete environment.NODE_OPTIONS;
  delete environment.npm_config_node_options;
  delete environment.NPM_CONFIG_NODE_OPTIONS;
  delete environment.DEEPSEEK_API_KEY;
  delete environment.APPFACTORY_ZHIPU_API_KEY;
  delete environment.APPFACTORY_DEEPSEEK_API_KEY;
  const profile = getModelProfile(options.modelProfileId);
  const apiKey = getModelApiKey(profile);
  if (profile.id === "glm-5.3-flash") environment.APPFACTORY_ZHIPU_API_KEY = apiKey;
  if (profile.id === "deepseek-v4-flash") environment.DEEPSEEK_API_KEY = apiKey;
  environment.PI_CODING_AGENT_DIR = ensurePiAgentConfig();
  return environment;
}

export function createPiRunArgs(
  session: HarnessSessionRef,
  prompt: string,
  options: HarnessRunOptions,
) {
  const profile = getModelProfile(options.modelProfileId);
  return [
    "--provider", profile.piProvider,
    "--model", profile.model,
    "--thinking", options.thinkingLevel,
    "--mode", "json",
    "--approve",
    "--session-id", session.id,
    "--session-dir", path.join(process.cwd(), "storage", "appfactory", "pi-sessions"),
    "--skill", path.join(process.cwd(), "app_factory", "skills", "nextjs-build"),
    "--",
    prompt,
  ];
}

export class PiHarnessRuntime implements HarnessRuntime {
  private readonly children = new Map<string, ChildProcess>();
  async createSession(projectId: string, cwd: string) { return { id: `pi-${crypto.randomUUID()}`, projectId, harness: "pi" as const, cwd }; }
  async *run(
    session: HarnessSessionRef,
    prompt: string,
    options: HarnessRunOptions,
  ): AsyncGenerator<HarnessEvent> {
    // Next standalone 进程不一定把项目 env 文件回写到子进程环境，启动 Pi 前显式加载一次。
    loadEnvConfig(process.cwd());
    const piBin = path.join(process.cwd(), "node_modules", ".bin", "pi");
    const profile = getModelProfile(options.modelProfileId);
    const configurationError = getModelConfigurationError(profile);
    if (configurationError) throw new Error(configurationError);
    const child = spawn(piBin, createPiRunArgs(session, prompt, options), { cwd: session.cwd, env: piEnvironment(options), stdio: ["ignore", "pipe", "pipe"] });
    this.children.set(session.id, child);
    try {
      const queue: HarnessEvent[] = [];
      let done = false;
      let wake: (() => void) | undefined;
      const push = (event: HarnessEvent) => { queue.push(event); wake?.(); wake = undefined; };
      const toolInputs = new Map<string, Record<string, unknown>>();
      const diagnostics: string[] = [];
      let stdoutBuffer = "";
      const consumeLine = (line: string) => {
        if (!line.trim()) return;
        try {
          const raw = JSON.parse(line) as Record<string, unknown>;
          const rawType = typeof raw.type === "string" ? raw.type : "";
          if (rawType === "tool_execution_start" && typeof raw.toolCallId === "string") {
            toolInputs.set(raw.toolCallId, (raw.args as Record<string, unknown>) || {});
          }
          const rawToolCallId = typeof raw.toolCallId === "string" ? raw.toolCallId : "";
          const fallbackInput = rawToolCallId ? toolInputs.get(rawToolCallId) : undefined;
          const event = normalizePiEvent(raw, new Date().toISOString(), fallbackInput);
          if (event) push(event);
          if (rawType === "tool_execution_end" && rawToolCallId) toolInputs.delete(rawToolCallId);
        } catch {
          diagnostics.push(line.slice(0, 280));
        }
      };
      child.stdout?.on("data", (chunk) => {
        stdoutBuffer += chunk.toString();
        const lines = stdoutBuffer.split(/\r?\n/);
        stdoutBuffer = lines.pop() || "";
        lines.forEach(consumeLine);
      });
      // Pi JSON 模式的 stdout 是结构化事件；stderr 只保留诊断，不冒充 AI 回复。
      child.stderr?.on("data", (chunk) => {
        const diagnostic = chunk.toString().trim();
        if (diagnostic) diagnostics.push(diagnostic.slice(0, 280));
      });
      const completion = new Promise<number | null>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code) => {
          if (stdoutBuffer.trim()) {
            consumeLine(stdoutBuffer);
            stdoutBuffer = "";
          }
          done = true;
          wake?.();
          resolve(code);
        });
      });
      while (!done || queue.length) { if (!queue.length) await new Promise<void>((resolve) => { wake = resolve; }); while (queue.length) yield queue.shift()!; }
      const code = await completion;
      if (code === 0) yield { type: "completed", content: "任务已完成", timestamp: new Date().toISOString() };
      else {
        const detail = diagnostics.at(-1);
        yield { type: "error", content: detail || `Pi 进程退出（code=${code ?? "unknown"}）`, timestamp: new Date().toISOString() };
      }
    } finally { this.children.delete(session.id); }
  }
  async cancel(session: HarnessSessionRef) { this.children.get(session.id)?.kill("SIGTERM"); }
  async release(session: HarnessSessionRef) { await this.cancel(session); }
}

export const piHarnessRuntime = new PiHarnessRuntime();
