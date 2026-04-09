"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  deleteNanobotSession,
  getNanobotBootstrap,
  getNanobotConfigFile,
  getNanobotSessionDetail,
  getNanobotWorkspaceFile,
  saveNanobotConfigFile,
  saveNanobotSecurityList,
  saveNanobotWorkspaceFile,
  streamNanobotMessage,
} from "@/features/bots/api";
import type {
  NanobotBootstrap,
  NanobotWorkspaceFileKind,
} from "@/features/bots/types";
import {
  BotConfigPanel,
  type ConfigEditorKind,
} from "@/components/bots/bot-config-panel";
import { BotConfigEdit } from "@/components/bots/bot-config-edit";
import { BotComposerPane } from "@/components/bots/bot-composer-pane";
import { BotSessionPane } from "@/components/bots/bot-session-pane";
import { BotTranscriptPane } from "@/components/bots/bot-transcript-pane";
import { WorkbenchConfigDrawer } from "@/components/workbench/workbench-config-drawer";
import { WorkbenchEmptyState } from "@/components/workbench/workbench-empty-state";
import { WorkbenchSearchResultPane } from "@/components/workbench/workbench-search-result-pane";
import { WorkbenchSessionSidebar } from "@/components/workbench/workbench-session-sidebar";
import {
  listWorkbenchKnowledgeOptions,
  searchWorkbenchKnowledge,
  type WorkbenchKnowledgeOption,
  type WorkbenchSearchResult,
} from "@/features/workbench/api";

type WorkbenchPageProps = {
  agentId: string;
};

type WorkbenchMode = "search" | "chat";

export function WorkbenchPage({ agentId }: WorkbenchPageProps) {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [bootstrap, setBootstrap] = useState<NanobotBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const [expandedSessionKey, setExpandedSessionKey] = useState("");
  const [composerResetTick, setComposerResetTick] = useState(0);
  const [sending, setSending] = useState(false);
  const [composerStatus, setComposerStatus] = useState("");
  const [editorKind, setEditorKind] = useState<ConfigEditorKind | null>(null);
  const [editorValue, setEditorValue] = useState("");
  const [editorPath, setEditorPath] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorStatus, setEditorStatus] = useState("");
  const [sessionSidebarExpanded, setSessionSidebarExpanded] = useState(false);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [mode, setMode] = useState<WorkbenchMode>("search");
  const [knowledgeOptions, setKnowledgeOptions] = useState<WorkbenchKnowledgeOption[]>([]);
  const [knowledgeId, setKnowledgeId] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState<WorkbenchSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  function syncUrl(options?: {
    sessionKey?: string;
    anchor?: string;
    newSession?: boolean;
  }) {
    const url = new URL(window.location.href);
    if (options?.sessionKey) {
      url.searchParams.set("session_key", options.sessionKey);
    } else {
      url.searchParams.delete("session_key");
    }
    if (options?.newSession) {
      url.searchParams.set("new", "1");
    } else {
      url.searchParams.delete("new");
    }
    url.hash = options?.anchor ? `#${options.anchor}` : "";
    window.history.replaceState({}, "", url);
  }

  function closeEditor() {
    setEditorKind(null);
    setEditorValue("");
    setEditorPath("");
    setEditorStatus("");
    setEditorLoading(false);
  }

  function getEditorTitle(kind: ConfigEditorKind | null) {
    switch (kind) {
      case "config-file":
        return "编辑配置文件";
      case "write-allow":
        return "编辑写入白名单";
      case "read-deny":
        return "编辑读取黑名单";
      case "soul":
        return "编辑 SOUL.md";
      case "agents":
        return "编辑 AGENTS.md";
      case "user":
        return "编辑 USER.md";
      case "memory":
        return "编辑 MEMORY.md";
      case "tools":
        return "编辑 TOOLS.md";
      case "heartbeat":
        return "编辑 HEARTBEAT.md";
      default:
        return "";
    }
  }

  async function handleOpenEditor(kind: ConfigEditorKind) {
    if (!bootstrap) {
      return;
    }

    setEditorKind(kind);
    setEditorStatus("");

    if (kind === "config-file") {
      setEditorLoading(true);
      setEditorValue("");
      setEditorPath(bootstrap.agent.config_path || "config.json");

      try {
        const data = await getNanobotConfigFile(agentId);
        setEditorValue(data.content || "");
        setEditorPath(data.path || bootstrap.agent.config_path || "config.json");
      } catch (loadError) {
        setEditorStatus(
          loadError instanceof Error ? loadError.message : "配置文件加载失败",
        );
      } finally {
        setEditorLoading(false);
      }
      return;
    }

    if (
      kind === "soul" ||
      kind === "agents" ||
      kind === "user" ||
      kind === "memory" ||
      kind === "tools" ||
      kind === "heartbeat"
    ) {
      setEditorLoading(true);
      setEditorValue("");
      setEditorPath("");

      try {
        const data = await getNanobotWorkspaceFile(
          agentId,
          kind as NanobotWorkspaceFileKind,
        );
        setEditorValue(data.content || "");
        setEditorPath(data.path || "");
      } catch (loadError) {
        setEditorStatus(
          loadError instanceof Error ? loadError.message : "配置文件加载失败",
        );
      } finally {
        setEditorLoading(false);
      }
      return;
    }

    const securityPath = bootstrap.security_list.path || "security_list.json";
    setEditorLoading(false);
    setEditorPath(securityPath);
    setEditorValue(
      kind === "write-allow"
        ? bootstrap.security_list.write_allow_text || ""
        : bootstrap.security_list.read_deny_text || "",
    );
  }

  async function handleSaveEditor() {
    if (!bootstrap || !editorKind) {
      return;
    }

    setEditorSaving(true);
    setEditorStatus("");

    try {
      if (editorKind === "config-file") {
        await saveNanobotConfigFile(agentId, {
          content: editorValue,
        });
        closeEditor();
        setReloadTick((current) => current + 1);
        return;
      }

      if (
        editorKind === "soul" ||
        editorKind === "agents" ||
        editorKind === "user" ||
        editorKind === "memory" ||
        editorKind === "tools" ||
        editorKind === "heartbeat"
      ) {
        await saveNanobotWorkspaceFile(
          agentId,
          editorKind as NanobotWorkspaceFileKind,
          {
            content: editorValue,
          },
        );
        closeEditor();
        return;
      }

      const data = await saveNanobotSecurityList(agentId, {
        write_allow_text:
          editorKind === "write-allow"
            ? editorValue
            : bootstrap.security_list.write_allow_text,
        read_deny_text:
          editorKind === "read-deny"
            ? editorValue
            : bootstrap.security_list.read_deny_text,
      });
      setBootstrap((current) =>
        current
          ? {
              ...current,
              security_list: {
                ...current.security_list,
                ...data,
              },
            }
          : current,
      );
      closeEditor();
    } catch (saveError) {
      setEditorStatus(
        saveError instanceof Error ? saveError.message : "保存失败，请检查后端日志",
      );
    } finally {
      setEditorSaving(false);
    }
  }

  async function handleOpenSession(sessionKey: string, anchor = "") {
    if (!bootstrap || !sessionKey) {
      return;
    }

    try {
      if (bootstrap.current_key !== sessionKey) {
        const detail = await getNanobotSessionDetail(agentId, sessionKey);
        setBootstrap({
          ...bootstrap,
          current_key: sessionKey,
          current_detail: detail,
        });
        setExpandedSessionKey(sessionKey);
      } else {
        setExpandedSessionKey((current) =>
          current === sessionKey ? "" : sessionKey,
        );
      }

      setComposerStatus("");
      setComposerResetTick((current) => current + 1);
      syncUrl({ sessionKey, anchor });
      if (anchor) {
        window.requestAnimationFrame(() => {
          document.getElementById(anchor)?.scrollIntoView({ block: "start" });
        });
      }
    } catch (sessionError) {
      setComposerStatus(
        sessionError instanceof Error ? sessionError.message : "会话加载失败",
      );
    }
  }

  async function handleDeleteSession(sessionKey: string) {
    if (!bootstrap || !sessionKey) {
      return;
    }
    if (!window.confirm("确认删除这个会话吗？删除后不可恢复。")) {
      return;
    }

    setComposerStatus("");

    try {
      const data = await deleteNanobotSession(agentId, sessionKey);
      const deletedCurrent = bootstrap.current_key === sessionKey;
      const nextCurrentKey = deletedCurrent ? (data.sessions[0]?.key ?? null) : bootstrap.current_key;
      let nextDetail = deletedCurrent ? null : bootstrap.current_detail;

      if (deletedCurrent && nextCurrentKey) {
        try {
          nextDetail = await getNanobotSessionDetail(agentId, nextCurrentKey);
        } catch {
          nextDetail = null;
        }
      }

      setBootstrap({
        ...bootstrap,
        sessions: data.sessions || [],
        current_key: nextCurrentKey,
        current_detail: nextDetail,
      });
      setExpandedSessionKey((current) => {
        if (current !== sessionKey) {
          return current;
        }
        return nextCurrentKey || "";
      });
      setComposerResetTick((current) => current + 1);
      syncUrl({
        sessionKey: nextCurrentKey || undefined,
        newSession: !nextCurrentKey,
      });
    } catch (deleteError) {
      setComposerStatus(
        deleteError instanceof Error ? deleteError.message : "删除会话失败",
      );
    }
  }

  async function handleSendMessage(content: string) {
    if (!bootstrap) {
      return;
    }

    setSending(true);
    setComposerStatus("");

    try {
      const data = await streamNanobotMessage(
        agentId,
        {
          content,
          session_key: bootstrap.current_key || "",
        },
        {
          onProgress: (message) => {
            setComposerStatus(message);
          },
        },
      );

      setBootstrap((current) =>
        current
          ? {
              ...current,
              sessions: data.sessions || [],
              current_key: data.session_key,
              current_detail: data.detail,
            }
          : current,
      );
      setExpandedSessionKey(data.session_key);
      setComposerResetTick((current) => current + 1);
      setComposerStatus("");
      syncUrl({ sessionKey: data.session_key });
    } catch (sendError) {
      setComposerStatus(
        sendError instanceof Error ? sendError.message : "发送失败，请重试",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleSearch(content: string) {
    const query = content.trim();

    if (!knowledgeId) {
      setSearchError("请先选择一个知识库");
      return;
    }

    if (!query) {
      setSearchError("请输入检索问题");
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setSearchError("");
    setSearchStatus("正在检索相关片段...");

    try {
      const result = await searchWorkbenchKnowledge({
        knowledgeId,
        query,
      });
      setSearchResult(result);
      setSearchStatus(result.items.length ? `已召回 ${result.items.length} 个片段` : "未找到相关片段");
    } catch (searchLoadError) {
      setSearchResult(null);
      setSearchStatus("");
      setSearchError(
        searchLoadError instanceof Error ? searchLoadError.message : "检索失败，请重试",
      );
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const currentSearch = new URLSearchParams(searchParamsKey);
        const sessionKey = currentSearch.get("session_key") || undefined;
        const data = await getNanobotBootstrap({
          agentId,
          sessionKey,
          newSession: sessionKey ? false : true,
        });

        if (!active) {
          return;
        }

        setBootstrap(data);
        setExpandedSessionKey(data.current_key || "");
        setComposerStatus("");
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "加载失败");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [agentId, reloadTick, searchParamsKey]);

  useEffect(() => {
    let active = true;

    async function loadKnowledgeOptions() {
      try {
        const items = await listWorkbenchKnowledgeOptions();

        if (!active) {
          return;
        }

        setKnowledgeOptions(items);
        setKnowledgeId((current) => current || items[0]?.id || "");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setSearchError(
          loadError instanceof Error ? loadError.message : "知识库加载失败",
        );
      }
    }

    void loadKnowledgeOptions();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="app-card flex min-h-[240px] items-center justify-center px-6 text-[14px] text-[#667085]">
        正在加载工作台...
      </div>
    );
  }

  if (error || !bootstrap) {
    return (
      <div className="app-card flex min-h-[240px] flex-col items-center justify-center gap-4 px-6">
        <div className="text-[18px] font-semibold text-title">工作台加载失败</div>
        <div className="text-center text-[13px] leading-6 text-[#667085]">
          {error || "未获取到自由体数据"}
        </div>
        <button
          type="button"
          onClick={() => setReloadTick((current) => current + 1)}
          className="h-[34px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87]"
        >
          重新加载
        </button>
      </div>
    );
  }

  const hasConversation = !!bootstrap.current_detail?.turns.length;
  const selectedKnowledge =
    knowledgeOptions.find((item) => item.id === knowledgeId) ?? null;
  const composerMetaSlot = (
    <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#7f8ea3]">
      <div className="flex items-center gap-1 rounded-[8px] border border-[#dbe5f0] bg-white px-1 py-1">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={[
            "rounded-[6px] px-2.5 py-1 transition-colors",
            mode === "search"
              ? "bg-[#eef5fd] text-[#1a4d87]"
              : "text-[#667085] hover:bg-[#f5f8fb]",
          ].join(" ")}
        >
          搜索
        </button>
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={[
            "rounded-[6px] px-2.5 py-1 transition-colors",
            mode === "chat"
              ? "bg-[#eef5fd] text-[#1a4d87]"
              : "text-[#667085] hover:bg-[#f5f8fb]",
          ].join(" ")}
        >
          问答
        </button>
      </div>

      {mode === "chat" ? (
        <div className="truncate">
          {composerStatus
            ? `处理中：${composerStatus}`
            : sending
              ? "nanobot 正在处理这条消息..."
              : `模型：${bootstrap.model_name || "-"}`}
        </div>
      ) : (
        <>
          <label className="shrink-0 text-[#7f8ea3]">知识库</label>
          <select
            value={knowledgeId}
            onChange={(event) => setKnowledgeId(event.target.value)}
            className="h-[32px] min-w-[220px] rounded-[8px] border border-[#dbe5f0] bg-white px-2.5 text-[12px] text-title outline-none transition-colors focus:border-[#6f96c4]"
          >
            <option value="">请选择知识库</option>
            {knowledgeOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="truncate">{searchStatus || "通过问题召回相关片段和文档索引"}</div>
        </>
      )}
    </div>
  );

  return (
    <>
      <section className="-ml-6 grid h-[calc(100vh-104px)] min-h-0 w-[calc(100%+1.5rem)] grid-cols-[auto_minmax(0,1fr)] py-1 sm:-ml-8 sm:w-[calc(100%+2rem)]">
        <WorkbenchSessionSidebar
          expanded={sessionSidebarExpanded}
          sessionCount={bootstrap.sessions.length}
          onToggle={() => setSessionSidebarExpanded((current) => !current)}
          onStartNewSession={() => {
            setExpandedSessionKey("");
            setComposerStatus("");
            setComposerResetTick((current) => current + 1);
            syncUrl({ newSession: true });
            setReloadTick((current) => current + 1);
          }}
        >
          <BotSessionPane
            sessions={bootstrap.sessions}
            currentKey={bootstrap.current_key}
            currentDetail={bootstrap.current_detail}
            expandedSessionKey={expandedSessionKey}
            noHover
            onOpenSession={(sessionKey, anchor) => handleOpenSession(sessionKey, anchor)}
            onDeleteSession={(sessionKey) => handleDeleteSession(sessionKey)}
            onStartNewSession={() => {
              setExpandedSessionKey("");
              setComposerStatus("");
              syncUrl({ newSession: true });
              setReloadTick((current) => current + 1);
            }}
          />
        </WorkbenchSessionSidebar>

        {hasConversation ? (
          <section className="min-h-0 min-w-0 overflow-hidden rounded-[18px] bg-white px-5 py-4">
            <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
              <BotComposerPane
                sending={mode === "chat" ? sending : searching}
                status={mode === "chat" ? composerStatus : searchStatus}
                modelName={bootstrap.model_name || ""}
                metaSlot={composerMetaSlot}
                title={mode === "chat" ? "继续对话" : "知识检索"}
                placeholder={
                  mode === "chat"
                    ? "输入问题或任务，继续对话"
                    : "输入问题，搜索知识库中的相关片段"
                }
                noHover
                resetKey={`${bootstrap.current_key || "new"}:${composerResetTick}`}
                submitLabel={mode === "chat" ? "发送" : "搜索"}
                footerActions={
                  mode === "chat" ? (
                    <button
                      type="button"
                      onClick={() => setConfigDrawerOpen(true)}
                      className="h-[36px] rounded-[8px] border border-[#dbe5f0] px-4 text-[13px] font-medium text-[#356da8] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
                    >
                      配置
                    </button>
                  ) : null
                }
                onSend={mode === "chat" ? handleSendMessage : handleSearch}
              />
              {mode === "chat" ? (
                <BotTranscriptPane detail={bootstrap.current_detail} noHover />
              ) : (
                <WorkbenchSearchResultPane
                  searching={searching}
                  query={searchResult?.query || ""}
                  knowledgeName={selectedKnowledge?.name || ""}
                  hasSearched={hasSearched}
                  error={searchError}
                  items={searchResult?.items ?? []}
                />
              )}
            </div>
          </section>
        ) : (
          <div className="min-h-0 min-w-0 overflow-hidden rounded-[18px] bg-white px-5 py-4">
            {mode === "chat" ? (
              <WorkbenchEmptyState
                modelName={bootstrap.model_name || ""}
                sending={sending}
                status={composerStatus}
                resetKey={`${bootstrap.current_key || "new"}:${composerResetTick}`}
                onSend={handleSendMessage}
              />
            ) : (
              <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
                <BotComposerPane
                  sending={searching}
                  status={searchStatus}
                  modelName={bootstrap.model_name || ""}
                  metaSlot={composerMetaSlot}
                  title="知识检索"
                  placeholder="输入问题，搜索知识库中的相关片段"
                  noHover
                  resetKey={`search:${composerResetTick}`}
                  submitLabel="搜索"
                  onSend={handleSearch}
                />
                <WorkbenchSearchResultPane
                  searching={searching}
                  query={searchResult?.query || ""}
                  knowledgeName={selectedKnowledge?.name || ""}
                  hasSearched={hasSearched}
                  error={searchError}
                  items={searchResult?.items ?? []}
                />
              </div>
            )}
          </div>
        )}
      </section>

      <WorkbenchConfigDrawer
        open={configDrawerOpen}
        onClose={() => setConfigDrawerOpen(false)}
      >
        <BotConfigPanel
          workspacePath={bootstrap.workspace_path}
          configPath={bootstrap.agent.config_path || ""}
          securityListPath={bootstrap.security_list.path || "security_list.json"}
          writeAllowText={bootstrap.security_list.write_allow_text || ""}
          readDenyText={bootstrap.security_list.read_deny_text || ""}
          noHover
          onEdit={(kind) => void handleOpenEditor(kind)}
        />
      </WorkbenchConfigDrawer>

      <BotConfigEdit
        open={!!editorKind}
        title={getEditorTitle(editorKind)}
        pathLabel={editorPath}
        value={editorValue}
        loading={editorLoading}
        saving={editorSaving}
        status={editorStatus}
        onChange={setEditorValue}
        onClose={closeEditor}
        onSave={() => void handleSaveEditor()}
      />
    </>
  );
}
