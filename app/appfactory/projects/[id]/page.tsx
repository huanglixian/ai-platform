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
  workspaceEventLabel,
  type WorkspaceEvent,
} from "@/app/appfactory/_components/workspace-panels";

type Project = {
  id: string;
  name: string;
  description: string;
  agentHubMode: "disabled" | "local" | "http";
  skillProfile?: string;
};
type ProjectStatus = {
  preview?: { url?: string; status?: string };
  build?: { status?: string };
  release?: unknown;
  deployment?: { url?: string; status?: string };
};
type RuntimeStatus = {
  ai?: {
    configured?: boolean;
    provider?: string | null;
    model?: string | null;
  };
  harness?: { ready?: boolean; name?: string };
  skill?: { ready?: boolean };
};
type Operation =
  { kind: "action"; name: string } | { kind: "prompt"; prompt: string };
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
  const [session, setSession] = useState<{ id: string } | null>(null);
  const [runtime, setRuntime] = useState<RuntimeStatus>({});
  const [status, setStatus] = useState<ProjectStatus>({});
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
  const [activityOpen, setActivityOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastOperation, setLastOperation] = useState<Operation | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const tree = useMemo(
    () => buildFileTree(files, changedFiles),
    [files, changedFiles],
  );
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
  const refreshStatus = async () => {
    const response = await fetch(`/api/appfactory/v1/projects/${id}/status`);
    const payload = await response.json();
    setStatus(payload.data ?? {});
  };
  useEffect(() => {
    let active = true;
    params.then(async ({ id: projectId }) => {
      setId(projectId);
      try {
        const responses = await Promise.all([
          fetch(`/api/appfactory/v1/projects/${projectId}`),
          fetch(`/api/appfactory/v1/projects/${projectId}/sessions`),
          fetch(`/api/appfactory/v1/projects/${projectId}/status`),
          fetch(`/api/appfactory/v1/projects/${projectId}/files`),
          fetch(`/api/appfactory/v1/projects/${projectId}/files?changed=1`),
          fetch("/api/appfactory/v1/runtime/status"),
        ]);
        const [
          projectRes,
          sessionsRes,
          statusRes,
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
        const currentSession =
          sessionsPayload.data?.[0] ??
            (
              await fetch(`/api/appfactory/v1/projects/${projectId}/sessions`, {
                method: "POST",
              }).then((response) => response.json())
            ).data;
        setSession(currentSession);
        if (currentSession?.id) {
          const transcriptResponse = await fetch(
            `/api/appfactory/v1/sessions/${currentSession.id}/transcript`,
          );
          const transcriptPayload = await transcriptResponse.json();
          if (transcriptResponse.ok && Array.isArray(transcriptPayload.data)) {
            setEvents(
              transcriptPayload.data.filter(
                (event: unknown): event is WorkspaceEvent =>
                  Boolean(
                    event &&
                      typeof event === "object" &&
                      "type" in event &&
                      "content" in event &&
                      typeof event.type === "string" &&
                      typeof event.content === "string",
                  ),
              ),
            );
          }
        }
        setStatus((await statusRes.json()).data ?? {});
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
  const action = async (name: string, remember = true) => {
    if (remember) setLastOperation({ kind: "action", name });
    setBusy(true);
    setError("");
    const previewWindow =
      name === "preview"
        ? window.open("about:blank", "appfactory-preview")
        : null;
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await fetch(
        `/api/appfactory/v1/projects/${id}/${name}`,
        { method: "POST", signal: controller.signal },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(errorText(payload, `${name} 失败`));
      setEvents((current) => [
        ...current,
        { type: name, content: JSON.stringify(payload.data ?? payload.error) },
      ]);
      if (name === "preview" && previewWindow && payload.data?.url)
        previewWindow.location.href = payload.data.url;
      await refreshFiles();
      await refreshStatus();
    } catch (reason) {
      previewWindow?.close();
      if ((reason as { name?: string })?.name !== "AbortError")
        setError(reason instanceof Error ? reason.message : `${name} 失败`);
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };
  const executePrompt = async (text: string, remember = true) => {
    if (!session || busy || !text.trim()) return;
    if (remember) setLastOperation({ kind: "prompt", prompt: text });
    setBusy(true);
    setError("");
    setEvents((current) => [...current, { type: "user", content: text }]);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await fetch(
        `/api/appfactory/v1/sessions/${session.id}/run`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(errorText(payload, "Pi 执行失败"));
      setEvents((current) => [
        ...current,
        ...(payload.data?.events ?? []).filter(
          (event: WorkspaceEvent) => event.type !== "user",
        ),
      ]);
      setPrompt("");
      await refreshFiles();
    } catch (reason) {
      if ((reason as { name?: string })?.name !== "AbortError")
        setError(reason instanceof Error ? reason.message : "Pi 执行失败");
    } finally {
      setBusy(false);
      controllerRef.current = null;
      void refreshStatus();
    }
  };
  const retry = () => {
    if (!lastOperation || busy) return;
    if (lastOperation.kind === "action") void action(lastOperation.name, false);
    else void executePrompt(lastOperation.prompt, false);
  };
  const stop = () => {
    controllerRef.current?.abort();
    if (session)
      void fetch(`/api/appfactory/v1/sessions/${session.id}/run`, {
        method: "DELETE",
      });
    setBusy(false);
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
  const aiReady = Boolean(
    runtime.ai?.configured && runtime.harness?.ready && runtime.skill?.ready,
  );
  const statusLabel = busy ? "执行中" : aiReady ? "AI 已连接" : "需要设置";
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
            className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:flex ${busy ? "bg-[#fff7e8] text-[#b06d13]" : aiReady ? "bg-[#eef8f2] text-[#1f8a57]" : "bg-[#fff5f4] text-[#b9382f]"}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden text-[10px] text-[#98a2b3] lg:inline">
            Pi Harness · {runtime.ai?.model || "未配置模型"}
          </span>
          <button
            type="button"
            onClick={() => setActivityOpen(true)}
            className="h-8 rounded-lg border border-[#d4dde8] px-3 text-xs text-[#667085] hover:border-[#6f96c4] hover:text-[#0368b3]"
          >
            活动{events.length ? ` ${events.length}` : ""}
          </button>
          <button
            type="button"
            onClick={() => void action("check")}
            disabled={busy}
            className="hidden h-8 rounded-lg border border-[#d4dde8] px-3 text-xs text-[#667085] hover:text-[#0368b3] disabled:opacity-40 sm:inline"
          >
            检查
          </button>
          <button
            type="button"
            onClick={() => void action("build")}
            disabled={busy}
            className="hidden h-8 rounded-lg border border-[#d4dde8] px-3 text-xs text-[#667085] hover:text-[#0368b3] disabled:opacity-40 sm:inline"
          >
            构建
          </button>
          <button
            type="button"
            onClick={() => void action("preview")}
            disabled={busy}
            className="h-8 rounded-lg bg-[#0368b3] px-3 text-xs font-medium text-white hover:bg-[#1a4d87] disabled:opacity-40"
          >
            预览 ↗
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
          <div className="border-b border-[#edf1f5] px-4 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#4d4d4d]">当前对话</h2>
              <span className="text-[10px] text-[#98a2b3]">
                {session ? "已就绪" : "初始化中"}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#98a2b3]">
              {project.description || "和 AI 一起完成这个应用。"}
            </p>
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
          prompt={prompt}
          sessionReady={Boolean(session)}
          model={runtime.ai?.model || "未配置"}
          onPromptChange={setPrompt}
          onSend={() => void executePrompt(prompt)}
          onStop={stop}
        />
      </div>
      {activityOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0b3558]/15"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActivityOpen(false);
          }}
        >
          <aside className="absolute right-0 top-14 flex h-[calc(100dvh-56px)] w-full max-w-md flex-col border-l border-[#d4dde8] bg-white shadow-[-12px_0_30px_rgba(15,23,42,.12)]">
            <div className="flex items-center justify-between border-b border-[#edf1f5] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-[#1a4d87]">
                  活动日志
                </h2>
                <p className="mt-1 text-[10px] text-[#98a2b3]">
                  任务、工具调用和构建输出
                </p>
                <p className="mt-3 text-[11px] text-[#667085]">
                  Preview：{status.preview?.status || "未运行"} · 构建：
                  {status.build?.status || "未执行"} · AgentHub：
                  {project.agentHubMode === "disabled"
                    ? "独立模式"
                    : project.agentHubMode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivityOpen(false)}
                className="text-xl text-[#98a2b3]"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[#0f2032] p-4 font-mono text-[11px] leading-5 text-[#dbe8f5]">
              {events.length ? (
                events.map((event, index) => (
                  <div key={`${event.type}-${index}`} className="mb-3">
                    <span className="text-[#6fafe2]">
                      [{workspaceEventLabel[event.type] || event.type}]
                    </span>{" "}
                    {event.content}
                  </div>
                ))
              ) : (
                <span className="text-[#7891aa]">暂无活动记录</span>
              )}
            </div>
            <div className="border-t border-[#edf1f5] p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void action("check")}
                  className="rounded-lg border border-[#d4dde8] px-3 py-2 text-xs text-[#667085] disabled:opacity-40"
                >
                  检查
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void action("build")}
                  className="rounded-lg border border-[#d4dde8] px-3 py-2 text-xs text-[#667085] disabled:opacity-40"
                >
                  构建
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void action("deploy")}
                  className="rounded-lg border border-[#d4dde8] px-3 py-2 text-xs text-[#667085] disabled:opacity-40"
                >
                  发布到本地
                </button>
                {project.agentHubMode !== "disabled" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void action("register")}
                    className="rounded-lg bg-[#0368b3] px-3 py-2 text-xs font-medium text-white hover:bg-[#1a4d87] disabled:opacity-40"
                  >
                    发布到 AgentHub
                  </button>
                )}
                {lastOperation && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={retry}
                    className="rounded-lg border border-[#bfd7f2] px-3 py-2 text-xs text-[#0368b3] disabled:opacity-40"
                  >
                    重试
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
