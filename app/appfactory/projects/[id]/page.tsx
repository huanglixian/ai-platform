"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildFileTree,
  defaultFileTab,
} from "@/app/appfactory/_lib/project-ui";
import {
  ChatPanel,
  FileViewer,
  ProjectFileTree,
  type WorkspaceEvent,
} from "@/app/appfactory/_components/workspace-panels";
import { usePublicationTaskCenter } from "@/app/appfactory/_components/publication-task-center";
import type { RunFeedback } from "@/app/appfactory/_lib/run-state";
import { parseSseBlock } from "@/app/appfactory/_lib/sse";
import {
  deriveSessionTitle,
  getPiSessionStatusLabel,
  getSessionStatusLabel,
  type AppFactorySession,
} from "@/app_factory/types/session";

type Project = {
  id: string;
  name: string;
  description: string;
  template: { id: string; name: string; description: string };
};
type RuntimeStatus = {
  ai?: {
    configured?: boolean;
    provider?: string | null;
    model?: string | null;
    thinkingLevel?: "low" | "high" | "max";
  };
  modelSettings?: {
    profiles?: Array<{ id: string; configured: boolean }>;
  };
  harness?: { ready?: boolean; name?: string };
  templates?: Array<{ id: string; ready?: boolean }>;
};
type Operation = { kind: "prompt"; prompt: string };
const errorText = (
  payload: { error?: { message?: string } },
  fallback: string,
) => payload.error?.message || fallback;

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [session, setSession] = useState<AppFactorySession | null>(null);
  const [sessions, setSessions] = useState<AppFactorySession[]>([]);
  const [runtime, setRuntime] = useState<RuntimeStatus>({});
  const [prompt, setPrompt] = useState("");
  const [events, setEvents] = useState<WorkspaceEvent[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [changedFiles, setChangedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileDiff, setFileDiff] = useState("");
  const [fileMode, setFileMode] = useState<"diff" | "content">("content");
  const [fileOpen, setFileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "files">("chat");
  const [busy, setBusy] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [activeRun, setActiveRun] = useState<RunFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastOperation, setLastOperation] = useState<Operation | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const sessionLoadRef = useRef(0);
  const tree = useMemo(
    () => buildFileTree(files, changedFiles),
    [files, changedFiles],
  );
  const { publish, latestForProject } = usePublicationTaskCenter();
  const selectFile = async (path: string, reveal = true, projectId = id) => {
    setSelectedFile(path);
    setFileOpen(reveal);
    setFileMode(defaultFileTab(path, changedFiles));
    try {
      const response = await fetch(
        `/api/appfactory/v1/projects/${projectId}/files?path=${encodeURIComponent(path)}`,
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(errorText(payload, "文件内容加载失败"));
      setFileContent(payload.data?.content ?? "");
      setFileDiff(payload.data?.diff ?? "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "文件内容加载失败");
    }
  };
  const refreshFiles = async (preferred?: string) => {
    if (!id) return;
    const response = await fetch(`/api/appfactory/v1/projects/${id}/files`);
    const payload = await response.json();
    if (!response.ok) throw new Error(errorText(payload, "文件列表加载失败"));
    const next = Array.isArray(payload.data)
      ? payload.data.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : [];
    const changedResponse = await fetch(
      `/api/appfactory/v1/projects/${id}/files?changed=1`,
    );
    const changedPayload = await changedResponse.json();
    setFiles(next);
    setChangedFiles(
      Array.isArray(changedPayload.data)
        ? changedPayload.data.filter(
            (item: unknown): item is string => typeof item === "string",
          )
        : [],
    );
    const path =
      preferred && next.includes(preferred)
        ? preferred
        : selectedFile && next.includes(selectedFile)
          ? selectedFile
          : next[0];
    if (path) await selectFile(path, false);
  };
  const loadSessionTranscript = async (sessionId: string) => {
    const response = await fetch(
      `/api/appfactory/v1/sessions/${sessionId}/transcript`,
    );
    const payload = await response.json();
    if (!response.ok) throw new Error(errorText(payload, "对话记录加载失败"));
    return Array.isArray(payload.data)
      ? payload.data.filter(
          (event: unknown): event is WorkspaceEvent =>
            Boolean(
              event &&
                typeof event === "object" &&
                "type" in event &&
                "content" in event &&
                typeof event.type === "string" &&
                typeof event.content === "string",
            ),
        )
      : [];
  };
  const refreshSessions = async (projectId = id) => {
    if (!projectId) return;
    const response = await fetch(
      `/api/appfactory/v1/projects/${projectId}/sessions`,
    );
    const payload = await response.json();
    if (!response.ok) throw new Error(errorText(payload, "对话列表加载失败"));
    setSessions(
      Array.isArray(payload.data)
        ? (payload.data as AppFactorySession[])
        : [],
    );
  };
  const switchSession = async (nextSession: AppFactorySession) => {
    if (busy || sessionLoading || nextSession.id === session?.id) return;
    const requestId = ++sessionLoadRef.current;
    setSessionLoading(true);
    setSession(nextSession);
    setEvents([]);
    setActiveRun(null);
    setPrompt("");
    setLastOperation(null);
    setError(
      nextSession.piStatus === "missing"
        ? "该对话的 Pi 上下文文件缺失，历史记录仍可查看，但下一轮会从新上下文开始。"
        : "",
    );
    try {
      const nextEvents = await loadSessionTranscript(nextSession.id);
      if (sessionLoadRef.current === requestId) setEvents(nextEvents);
    } catch (reason) {
      if (sessionLoadRef.current === requestId) {
        setError(reason instanceof Error ? reason.message : "对话记录加载失败");
      }
    } finally {
      if (sessionLoadRef.current === requestId) setSessionLoading(false);
    }
  };
  const createConversation = async () => {
    if (!id || busy || sessionLoading) return;
    setSessionLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/appfactory/v1/projects/${id}/sessions`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok || !payload.data)
        throw new Error(errorText(payload, "新建对话失败"));
      const nextSession = payload.data as AppFactorySession;
      sessionLoadRef.current += 1;
      setSessions((current) => [
        nextSession,
        ...current.filter((item) => item.id !== nextSession.id),
      ]);
      setSession(nextSession);
      setEvents([]);
      setActiveRun(null);
      setPrompt("");
      setLastOperation(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "新建对话失败");
    } finally {
      setSessionLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    params.then(async ({ id: projectId }) => {
      setId(projectId);
      try {
        const responses = await Promise.all([
          fetch(`/api/appfactory/v1/projects/${projectId}`),
          fetch(`/api/appfactory/v1/projects/${projectId}/sessions`),
          fetch(`/api/appfactory/v1/projects/${projectId}/files`),
          fetch(`/api/appfactory/v1/projects/${projectId}/files?changed=1`),
          fetch("/api/appfactory/v1/runtime/status"),
        ]);
        const [
          projectRes,
          sessionsRes,
          filesRes,
          changedRes,
          runtimeRes,
        ] = responses;
        const projectPayload = await projectRes.json();
        if (!projectRes.ok)
          throw new Error(errorText(projectPayload, "项目加载失败"));
        const sessionsPayload = await sessionsRes.json();
        const filesPayload = await filesRes.json();
        const changedPayload = await changedRes.json();
        setProject(projectPayload.data);
        const listedSessions = Array.isArray(sessionsPayload.data)
          ? (sessionsPayload.data as AppFactorySession[])
          : [];
        const currentSession =
          listedSessions[0] ??
          (
            await fetch(`/api/appfactory/v1/projects/${projectId}/sessions`, {
              method: "POST",
            }).then((response) => response.json())
          ).data;
        setSessions(
          currentSession && !listedSessions.some((item) => item.id === currentSession.id)
            ? [currentSession, ...listedSessions]
            : listedSessions,
        );
        setSession(currentSession);
        if (currentSession?.piStatus === "missing") {
          setError(
            "该对话的 Pi 上下文文件缺失，历史记录仍可查看，但下一轮会从新上下文开始。",
          );
        }
        if (currentSession?.id) {
          setEvents(await loadSessionTranscript(currentSession.id));
        }
        setRuntime((await runtimeRes.json()).data ?? {});
        const nextFiles = Array.isArray(filesPayload.data)
          ? filesPayload.data.filter(
              (item: unknown): item is string => typeof item === "string",
            )
          : [];
        setFiles(nextFiles);
        setChangedFiles(
          Array.isArray(changedPayload.data)
            ? changedPayload.data.filter(
                (item: unknown): item is string => typeof item === "string",
              )
            : [],
        );
        if (nextFiles[0])
          await selectFile(
            nextFiles.includes("app/page.tsx") ? "app/page.tsx" : nextFiles[0],
            false,
            projectId,
          );
      } catch (reason) {
        if (active)
          setError(reason instanceof Error ? reason.message : "项目加载失败");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // 初始化只应响应路由参数；内部文件加载器使用解析后的 projectId。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  const openPreview = async () => {
    setError("");
    const previewWindow = window.open("", "_blank");
    try {
      if (previewWindow) {
        previewWindow.document.title = "正在启动预览";
        previewWindow.document.body.style.cssText =
          "margin:0;display:grid;min-height:100vh;place-items:center;background:#f6f8fb;color:#667085;font:14px system-ui,sans-serif";
        previewWindow.document.body.textContent = "正在启动应用预览…";
      }
      const response = await fetch(
        `/api/appfactory/v1/projects/${id}/preview`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(errorText(payload, "预览启动失败"));
      if (previewWindow && payload.data?.url)
        previewWindow.location.href = payload.data.url;
    } catch (reason) {
      previewWindow?.close();
      setError(reason instanceof Error ? reason.message : "预览启动失败");
    }
  };
  const executePrompt = async (text: string, remember = true) => {
    const submittedPrompt = text.trim();
    if (!session || busy || !submittedPrompt) return;
    if (remember) setLastOperation({ kind: "prompt", prompt: submittedPrompt });
    setBusy(true);
    setSessions((current) =>
      current.map((item) =>
        item.id === session.id
          ? {
              ...item,
              status: "running",
              title:
                item.title === "新对话"
                  ? deriveSessionTitle(submittedPrompt)
                  : item.title,
            }
          : item,
      ),
    );
    setError("");
    setPrompt("");
    setActiveRun({
      prompt: submittedPrompt,
      startedAt: Date.now(),
      status: "running",
    });
    setEvents((current) => [...current, { type: "user", content: submittedPrompt }]);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await fetch(
        `/api/appfactory/v1/sessions/${session.id}/run/stream`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: submittedPrompt }),
        },
      );
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(errorText(payload, "Pi 执行失败"));
      }
      if (!response.body) throw new Error("Pi 实时连接不可用");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let terminalStatus: "completed" | "failed" | null = null;
      const consumeBlock = (block: string) => {
        const parsed = parseSseBlock(block);
        if (!parsed || typeof parsed.data !== "object" || !parsed.data) return;
        if (parsed.event === "run.started") {
          const data = parsed.data as { runId?: string };
          if (data.runId) {
            setActiveRun((current) =>
              current ? { ...current, runId: data.runId } : current,
            );
          }
          return;
        }
        if (parsed.event === "run.finished") {
          const data = parsed.data as { status?: string };
          terminalStatus = data.status === "failed" ? "failed" : "completed";
          return;
        }
        if (parsed.event === "run.error") {
          const data = parsed.data as { message?: string };
          terminalStatus = "failed";
          const message = data.message || "Pi 实时连接失败";
          setActiveRun((current) =>
            current ? { ...current, status: "failed", message } : current,
          );
          setError(message);
          return;
        }
        if (parsed.event !== "harness") return;
        const event = parsed.data as WorkspaceEvent;
        if (!event.type || typeof event.content !== "string") return;
        if (event.type !== "user")
          setEvents((current) => [...current, event]);
        if (event.type === "activity") {
          setActiveRun((current) =>
            current ? { ...current, message: event.content } : current,
          );
        } else if (event.type === "text") {
          setActiveRun((current) =>
            current ? { ...current, message: "正在接收 AI 回复" } : current,
          );
        }
        if (event.type === "completed") terminalStatus = "completed";
        if (event.type === "error") {
          terminalStatus = "failed";
          setActiveRun((current) =>
            current
              ? { ...current, status: "failed", message: event.content }
              : current,
          );
          setError(event.content);
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || "";
        blocks.forEach(consumeBlock);
        if (done) break;
      }
      if (buffer.trim()) consumeBlock(buffer);
      if (terminalStatus === "completed") {
        setActiveRun((current) =>
          current
            ? {
                ...current,
                status: "completed",
                message: "执行结果已保存",
              }
            : current,
        );
      }
      else if (terminalStatus !== "failed") {
        const message = "实时连接中断，任务结果已保存在活动日志中";
        setActiveRun((current) =>
          current ? { ...current, status: "failed", message } : current,
        );
        setError(message);
      }
      await refreshFiles();
    } catch (reason) {
      if ((reason as { name?: string })?.name !== "AbortError") {
        const message = reason instanceof Error ? reason.message : "Pi 执行失败";
        setActiveRun((current) =>
          current ? { ...current, status: "failed", message } : current,
        );
        setError(reason instanceof Error ? reason.message : "Pi 执行失败");
      }
    } finally {
      setBusy(false);
      controllerRef.current = null;
      void refreshSessions();
    }
  };
  const retry = () => {
    if (!lastOperation || busy) return;
    void executePrompt(lastOperation.prompt, false);
  };
  const stop = () => {
    controllerRef.current?.abort();
    if (session)
      void fetch(`/api/appfactory/v1/sessions/${session.id}/run`, {
        method: "DELETE",
      });
    setBusy(false);
    setActiveRun((current) =>
      current ? { ...current, status: "cancelled", message: "已停止当前任务" } : current,
    );
    setError("已停止当前任务");
  };
  if (loading)
    return (
      <main className="grid h-[calc(100dvh-56px)] place-items-center text-sm text-[#98a2b3]">
        加载项目中…
      </main>
    );
  if (!project)
    return (
      <main className="grid h-[calc(100dvh-56px)] place-items-center text-sm text-[#b9382f]">
        {error || "项目不存在"}
      </main>
    );
  const activeModelConfigured = session
    ? runtime.modelSettings?.profiles?.find(
        (profile) => profile.id === session.modelProfileId,
      )?.configured
    : runtime.ai?.configured;
  const aiReady = Boolean(
    activeModelConfigured &&
      runtime.harness?.ready &&
      runtime.templates?.some((template) => template.id === project.template.id && template.ready),
  );
  const activeModelLabel = session?.modelLabel || runtime.ai?.model || "未配置模型";
  const publication = latestForProject(id);
  const statusLabel = publication?.status === "running" || publication?.status === "queued"
    ? "发布中"
    : publication?.status === "succeeded"
      ? "已发布"
      : publication?.status === "failed" || publication?.status === "cancelled"
        ? "发布失败"
        : busy ? "执行中" : aiReady ? "AI 已连接" : "需要设置";
  const statusClass = publication?.status === "running" || publication?.status === "queued" || busy
    ? "bg-[#fff7e8] text-[#b06d13]"
    : publication?.status === "succeeded" || (!publication && aiReady)
      ? "bg-[#eef8f2] text-[#1f8a57]"
      : "bg-[#fff5f4] text-[#b9382f]";
  return (
    <main className="flex h-[calc(100dvh-56px)] min-h-0 flex-col overflow-hidden bg-[#f6f8fb]">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-[#d4dde8] bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/appfactory"
            className="text-xs text-[#667085] hover:text-[#0368b3]"
          >
            项目
          </Link>
          <span className="text-[#c0c8d3]">/</span>
          <h1 className="truncate text-sm font-semibold text-[#1a4d87]">
            {project.name}
          </h1>
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:flex ${statusClass}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden text-[10px] text-[#98a2b3] lg:inline">
            Pi Harness · {activeModelLabel}
            {runtime.ai?.thinkingLevel ? ` · ${runtime.ai.thinkingLevel} 思考` : ""}
          </span>
          <button
            type="button"
            onClick={() => void openPreview()}
            disabled={busy}
            className="h-8 rounded-lg border border-[#bfd7f2] px-3 text-xs font-medium text-[#0368b3] hover:bg-[#eef5fd] disabled:opacity-40"
          >
            预览 ↗
          </button>
          <button
            type="button"
            onClick={() => void publish(id).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "创建发布任务失败"))}
            disabled={busy || publication?.status === "queued" || publication?.status === "running"}
            className="h-8 rounded-lg bg-[#0368b3] px-3 text-xs font-medium text-white hover:bg-[#1a4d87] disabled:opacity-40"
          >
            {publication?.status === "queued" || publication?.status === "running" ? "发布中…" : "发布"}
          </button>
        </div>
      </header>
      <div className="flex shrink-0 items-center gap-1 border-b border-[#d4dde8] bg-white px-3 py-2 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileView("chat")}
          className={`h-8 flex-1 rounded-lg text-xs font-medium ${mobileView === "chat" && !fileOpen ? "bg-[#eef5fd] text-[#0368b3]" : "text-[#667085]"}`}
        >
          对话
        </button>
        <button
          type="button"
          onClick={() => setMobileView("files")}
          className={`h-8 flex-1 rounded-lg text-xs font-medium ${mobileView === "files" && !fileOpen ? "bg-[#eef5fd] text-[#0368b3]" : "text-[#667085]"}`}
        >
          文件 {files.length ? `· ${files.length}` : ""}
        </button>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside
          className={`w-full shrink-0 border-r border-[#d4dde8] bg-white sm:w-[240px] lg:w-[20%] ${fileOpen || mobileView !== "files" ? "hidden" : "flex"} order-1 flex-col sm:flex`}
        >
          <div className="border-b border-[#edf1f5] px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#4d4d4d]">
                {sessionLoading ? "正在切换对话…" : `${sessions.length}个对话`}
              </span>
              <button
                type="button"
                onClick={() => void createConversation()}
                disabled={busy || sessionLoading}
                className="shrink-0 rounded-md border border-[#bfd7f2] px-2 py-1.5 text-[10px] font-medium text-[#0368b3] transition hover:bg-[#eef5fd] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ＋ 新建
              </button>
            </div>
            <p className="mt-1 truncate text-[10px] text-[#8aa0b6]">
              {session ? `当前：${session.modelLabel}（模型固定）` : "新建对话将使用默认模型"}
            </p>
          </div>
          <div className="max-h-48 min-h-0 overflow-auto border-b border-[#edf1f5] px-2 py-2">
            {sessions.length ? (
              <div className="space-y-1">
                {sessions.map((item) => {
                  const selected = item.id === session?.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void switchSession(item)}
                      disabled={busy || sessionLoading}
                      className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${selected ? "bg-[#eef5fd] text-[#0368b3]" : "text-[#667085] hover:bg-[#f6f8fb]"} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.status === "running" ? "animate-pulse bg-[#2e7dd2]" : item.status === "error" ? "bg-[#c94a42]" : selected ? "bg-[#2e7dd2]" : "bg-[#c5cfda]"}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium">
                          {item.title || "新对话"}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                          <span className={item.piStatus === "missing" ? "text-[#b9382f]" : "text-[#8aa0b6]"}>
                            {item.piStatus === "missing"
                              ? getPiSessionStatusLabel(item.piStatus)
                              : getSessionStatusLabel(item.status)}
                          </span>
                          <span className={`truncate ${selected ? "text-[#0368b3]" : "text-[#6f96c4]"}`}>
                            {item.modelLabel}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-2 py-3 text-center text-[10px] text-[#98a2b3]">
                还没有开发对话
              </p>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-2 py-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <h2 className="text-xs font-semibold text-[#4d4d4d]">项目文件</h2>
              <span className="text-[10px] text-[#98a2b3]">{files.length}</span>
            </div>
            {files.length ? (
              <ProjectFileTree
                nodes={tree}
                selected={selectedFile}
                onSelect={(path) => void selectFile(path)}
              />
            ) : (
              <p className="px-2 py-8 text-center text-xs text-[#98a2b3]">
                Workspace 暂无文件
              </p>
            )}
          </div>
        </aside>
        {fileOpen && (
          <FileViewer
            path={selectedFile}
            changed={changedFiles.includes(selectedFile)}
            mode={fileMode}
            content={fileContent}
            diff={fileDiff}
            onModeChange={setFileMode}
            onClose={() => {
              setFileOpen(false);
              setMobileView("chat");
            }}
            onDiscuss={() => {
              setPrompt(`请解释文件 ${selectedFile} 的作用，以及最近的修改。`);
              setFileOpen(false);
              setMobileView("chat");
            }}
          />
        )}
        <ChatPanel
          className={
            fileOpen || mobileView !== "chat"
              ? "hidden sm:flex sm:order-3"
              : "flex order-2 sm:order-3"
          }
          events={events}
          busy={busy}
          activeRun={activeRun}
          prompt={prompt}
          sessionReady={Boolean(session) && !sessionLoading}
          model={activeModelLabel}
          onPromptChange={setPrompt}
          onSend={() => void executePrompt(prompt)}
          onStop={stop}
          onRetry={retry}
        />
      </div>
    </main>
  );
}
