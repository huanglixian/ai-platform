import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import nextEnv from "@next/env";
import { normalizePiEvent } from "@/app_factory/features/pi-events";
import { ensurePiAgentConfig } from "@/app_factory/server/pi-agent-config";
import { getAppTemplate } from "@/app_factory/template-catalog";
import { dataPaths } from "@/lib/data-paths";
import {
  getModelApiKey,
  getModelConfigurationError,
  getModelName,
  getModelProfile,
  MODEL_PROFILE_IDS,
  isThinkingLevel,
} from "@/app_factory/server/model-profiles";
import type { HarnessEvent, HarnessRunOptions, HarnessRuntime, HarnessSessionRef } from "@/app_factory/types/harness";

function piEnvironment(options: HarnessRunOptions): NodeJS.ProcessEnv {
  const environment = { ...(options.task === "external-deployment" ? options.environment : process.env) };
  delete environment.NODE_OPTIONS;
  delete environment.npm_config_node_options;
  delete environment.NPM_CONFIG_NODE_OPTIONS;
  for (const id of MODEL_PROFILE_IDS) {
    const profile = getModelProfile(id);
    delete environment[profile.apiKeyEnv];
    delete environment[profile.piApiKeyEnv];
  }
  const profile = getModelProfile(options.modelProfileId);
  const apiKey = getModelApiKey(profile);
  environment[profile.piApiKeyEnv] = apiKey;
  environment.PI_CODING_AGENT_DIR = ensurePiAgentConfig();
  return environment;
}

export function createPiRunArgs(
  session: HarnessSessionRef,
  prompt: string,
  options: HarnessRunOptions,
) {
  const profile = getModelProfile(options.modelProfileId);
  const template = options.task === "external-deployment" ? null : getAppTemplate(options.templateId);
  if (!isThinkingLevel(profile.id, options.thinkingLevel)) throw new Error(`${profile.label} 不支持 ${options.thinkingLevel} 思考程度`);
  const skillPath = template?.rootPath ?? path.join(process.cwd(), "features", "apps", "deployment");
  const shortRulesPath = path.join(skillPath, "rules", "short-rules.md");
  if (template?.id === "nextjs-enterprise" && !fs.existsSync(shortRulesPath)) {
    throw new Error("Next.js 企业模板缺少平台短规则");
  }
  return [
    "--provider", profile.piProvider,
    "--model", getModelName(profile),
    "--thinking", options.thinkingLevel,
    "--mode", "json",
    ...(template ? ["--approve"] : ["--no-approve", "--no-extensions", "--no-skills", "--no-prompt-templates"]),
    "--session-id", session.id,
    "--session-dir", template ? dataPaths.appFactoryPiSessions : path.join(dataPaths.externalApps, session.projectId, "logs", "pi-sessions"),
    "--skill", skillPath,
    ...(template?.id === "nextjs-enterprise"
      ? ["--append-system-prompt", shortRulesPath]
      : []),
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
    nextEnv.loadEnvConfig(process.cwd());
    const piBin = path.join(process.cwd(), "node_modules", ".bin", "pi");
    const profile = getModelProfile(options.modelProfileId);
    const configurationError = getModelConfigurationError(profile);
    if (configurationError) throw new Error(configurationError);
    options.signal?.throwIfAborted();
    const child = spawn(piBin, createPiRunArgs(session, prompt, options), { cwd: session.cwd, env: piEnvironment(options), detached: options.task === "external-deployment", stdio: ["ignore", "pipe", "pipe"] });
    this.children.set(session.id, child);
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const abort = () => {
      if (!child.pid) return;
      const kill = (signal: NodeJS.Signals) => {
        try {
          if (options.task === "external-deployment") process.kill(-child.pid!, signal);
          else child.kill(signal);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
        }
      };
      kill("SIGTERM");
      killTimer = setTimeout(() => kill("SIGKILL"), 3_000);
    };
    options.signal?.addEventListener("abort", abort, { once: true });
    try {
      const queue: HarnessEvent[] = [];
      let done = false;
      let hasFailure = false;
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
          if (event) {
            if (event.type === "error") hasFailure = true;
            push(event);
          }
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
      const completion = new Promise<number | null>((resolve) => {
        child.once("error", (error) => {
          diagnostics.push(error.message);
          done = true;
          wake?.();
          resolve(1);
        });
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
      if (child.pid) options.onSpawn?.(child.pid);
      while (!done || queue.length) { if (!queue.length) await new Promise<void>((resolve) => { wake = resolve; }); while (queue.length) yield queue.shift()!; }
      const code = await completion;
      if (code === 0) {
        if (!hasFailure) yield { type: "completed", content: "任务已完成", timestamp: new Date().toISOString() };
      } else {
        const detail = diagnostics.at(-1);
        yield { type: "error", content: detail || `Pi 进程退出（code=${code ?? "unknown"}）`, timestamp: new Date().toISOString() };
      }
    } finally {
      options.signal?.removeEventListener("abort", abort);
      if (killTimer) clearTimeout(killTimer);
      if (options.task === "external-deployment" && child.pid) {
        try { process.kill(-child.pid, "SIGKILL"); } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
        }
      }
      this.children.delete(session.id);
    }
  }
  async cancel(session: HarnessSessionRef) { this.children.get(session.id)?.kill("SIGTERM"); }
  async release(session: HarnessSessionRef) { await this.cancel(session); }
}

export const piHarnessRuntime = new PiHarnessRuntime();
