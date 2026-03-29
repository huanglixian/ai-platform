"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  getNanobotBootstrap,
  getNanobotConfigFile,
  getNanobotSessionDetail,
  saveNanobotConfigFile,
  saveNanobotSecurityList,
  streamNanobotMessage,
} from "@/features/bots/api";
import type {
  NanobotBootstrap,
  NanobotMessageView,
  NanobotTurnView,
} from "@/features/bots/types";
import {
  BotConfigPanel,
  type ConfigEditorKind,
} from "./bot-config-panel";
import { BotConfigEdit } from "./bot-config-edit";

type BotWorkbenchProps = {
  agentId: string;
};

function buildTurnNavTitle(
  turn: { index: number; anchor: string; title: string },
  detailTurn?: NanobotTurnView,
) {
  const content = detailTurn?.user_message?.content || turn.title || "";
  const text = content.replace(/\s+/g, " ").trim();

  if (!text) {
    return `第 ${turn.index} 轮`;
  }

  return text.length > 30 ? `${text.slice(0, 30)}...` : text;
}

function MessageCard({ message }: { message: NanobotMessageView }) {
  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";

  return (
    <article
      className={[
        "rounded-[10px] border px-3 py-2.5",
        isUser
          ? "border-[#e4edf6] bg-white"
          : isAssistant
            ? "border-[#d8e8fa] bg-[#eef5fd]"
            : "border-[#edf2f7] bg-[#fafbfd]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isUser
              ? "bg-[#f3f6fa] text-[#51657d]"
              : isAssistant
                ? "bg-white text-[#356da8]"
                : "bg-white text-[#7f8ea3]",
          ].join(" ")}
        >
          {message.role_label}
        </span>
        <span className="text-[11px] text-[#98a2b3]">{message.timestamp || "-"}</span>
      </div>
      {message.tool_summary ? (
        <div className="mt-1.5 rounded-[8px] bg-white/80 px-2.5 py-1.5 text-[12px] text-[#51657d]">
          {message.tool_summary}
        </div>
      ) : null}
      <pre className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-5.5 text-title">
        {message.content || "(empty)"}
      </pre>
    </article>
  );
}

function TurnCard({ turn }: { turn: NanobotTurnView }) {
  return (
    <section className="rounded-[12px] border border-[#e4edf6] bg-white px-3.5 py-2.5">
      <div className="text-[11px] font-semibold text-[#7f8ea3]">
        第 {turn.index} 轮
      </div>
      <div className="mt-2.5 grid gap-2">
        {turn.user_message ? <MessageCard message={turn.user_message} /> : null}
        {turn.process_messages.length ? (
          <details className="rounded-[10px] border border-[#edf2f7] bg-[#fafbfd]">
            <summary className="cursor-pointer px-3 py-2 text-[12px] font-medium text-[#51657d]">
              思考过程（{turn.process_messages.length} 条）
            </summary>
            <div className="grid gap-2 border-t border-[#edf2f7] p-2.5">
              {turn.process_messages.map((message, index) => (
                <MessageCard
                  key={`${turn.anchor}-process-${index}`}
                  message={message}
                />
              ))}
            </div>
          </details>
        ) : null}
        {turn.final_message ? <MessageCard message={turn.final_message} /> : null}
      </div>
    </section>
  );
}

export function BotWorkbench({ agentId }: BotWorkbenchProps) {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [bootstrap, setBootstrap] = useState<NanobotBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const [expandedSessionKey, setExpandedSessionKey] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [sending, setSending] = useState(false);
  const [composerStatus, setComposerStatus] = useState("");
  const [editorKind, setEditorKind] = useState<ConfigEditorKind | null>(null);
  const [editorValue, setEditorValue] = useState("");
  const [editorPath, setEditorPath] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorStatus, setEditorStatus] = useState("");

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
      } else if (!anchor) {
        setExpandedSessionKey((current) =>
          current === sessionKey ? "" : sessionKey,
        );
      }

      setComposerStatus("");
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

  async function handleSendMessage() {
    if (!bootstrap) {
      return;
    }

    const content = composerValue.trim();
    if (!content) {
      return;
    }

    setSending(true);
    setComposerStatus("");

    try {
      const data = await streamNanobotMessage(agentId, {
        content,
        session_key: bootstrap.current_key || "",
      }, {
        onProgress: (message) => {
          setComposerStatus(message);
        },
      });
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
      setComposerValue("");
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

  function closeEditor() {
    setEditorKind(null);
    setEditorValue("");
    setEditorPath("");
    setEditorStatus("");
    setEditorLoading(false);
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

  function getEditorTitle(kind: ConfigEditorKind | null) {
    switch (kind) {
      case "config-file":
        return "编辑配置文件";
      case "write-allow":
        return "编辑写入白名单";
      case "read-deny":
        return "编辑读取黑名单";
      default:
        return "";
    }
  }

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const currentSearch = new URLSearchParams(searchParamsKey);
        const data = await getNanobotBootstrap({
          agentId,
          sessionKey: currentSearch.get("session_key") || undefined,
          newSession: currentSearch.get("new") === "1",
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

  if (loading) {
    return (
      <div className="app-card flex min-h-[240px] items-center justify-center px-6 text-[14px] text-[#667085]">
        正在加载自由体工作台...
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

  return (
    <section className="grid h-[calc(100vh-104px)] min-h-0 w-full gap-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
      <aside className="app-card flex min-h-0 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
          <div className="text-[15px] font-semibold text-title">会话列表</div>
          <div className="text-[12px] text-[#7f8ea3]">
            共 {bootstrap.sessions.length} 个
          </div>
        </div>
        <div className="border-b border-[#f0f4f8] px-4 py-3">
          <button
            type="button"
            onClick={() => {
              setExpandedSessionKey("");
              setComposerStatus("");
              syncUrl({ newSession: true });
            }}
            className="h-[32px] w-full rounded-[8px] border border-[#dbe5f0] px-3 text-[12px] font-medium text-[#356da8] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
          >
            新会话
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {bootstrap.sessions.length ? (
            bootstrap.sessions.map((session) => {
              const active = session.key === bootstrap.current_key;
              const expanded = session.key === expandedSessionKey;
              const detailTurns =
                active && bootstrap.current_detail?.key === session.key
                  ? bootstrap.current_detail.turns
                  : [];

              return (
                <div
                  key={session.key}
                  className={[
                    "rounded-[10px] border transition-colors",
                    active
                      ? "border-[#bfd7f2] bg-[#f8fbfe]"
                      : "border-[#e8eef5] bg-white",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => void handleOpenSession(session.key)}
                    className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-[13px] font-semibold text-title">
                        {session.title || session.key}
                      </div>
                      <div className="mt-1 truncate text-[11px] text-[#98a2b3]">
                        {session.updated_label || "未使用"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-[#7f8ea3]">
                      <div>{session.turn_count} 轮</div>
                    </div>
                  </button>
                  {expanded ? (
                    <div className="border-t border-[#eef2f6] px-3 py-3">
                      <div className="grid gap-2">
                        {session.turns.length ? (
                          session.turns.map((turn) => {
                            const detailTurn = detailTurns.find(
                              (item) => item.anchor === turn.anchor,
                            );
                            return (
                              <button
                                key={`${session.key}-${turn.anchor}`}
                                type="button"
                                onClick={() =>
                                  void handleOpenSession(session.key, turn.anchor)
                                }
                                className="flex min-w-0 items-center gap-3 rounded-[8px] border border-[#edf2f7] bg-white px-2.5 py-2 text-left transition-colors hover:border-[#d8e8fa] hover:bg-[#eef5fd]"
                              >
                                <span className="shrink-0 text-[11px] text-[#98a2b3]">
                                  #{turn.index}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[12px] text-title">
                                  {buildTurnNavTitle(turn, detailTurn)}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-[12px] text-[#98a2b3]">
                            当前没有轮次
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-[10px] border border-dashed border-[#d6e0eb] bg-[#fafbfd] px-4 py-6 text-[12px] leading-6 text-[#7f8ea3]">
              还没有会话。发送第一条消息后，这里会自动生成会话列表。
            </div>
          )}
        </div>
      </aside>

      <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
        <section className="app-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
            <div className="text-[15px] font-semibold text-title">发送消息</div>
            <div className="text-[12px] text-[#7f8ea3]">&nbsp;</div>
          </div>
          <div className="grid gap-3 px-4 py-4">
            <textarea
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!sending) {
                    void handleSendMessage();
                  }
                }
              }}
              placeholder="输入你的问题，在当前自由体下直接和 nanobot 对话"
              className="min-h-[120px] resize-none rounded-[12px] border border-[#dbe5f0] bg-white px-4 py-3 text-[13px] leading-6 text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="truncate text-[12px] text-[#7f8ea3]">
                {composerStatus
                  ? `处理中：${composerStatus}`
                  : sending
                    ? "nanobot 正在处理这条消息..."
                    : `模型：${bootstrap.model_name || "-"}`}
              </div>
              <button
                type="button"
                disabled={sending}
                onClick={() => void handleSendMessage()}
                className="h-[36px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
              >
                {sending ? "处理中..." : "发送"}
              </button>
            </div>
          </div>
        </section>

        <section className="app-card flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
            <div className="text-[15px] font-semibold text-title">对话记录</div>
            <div className="flex items-center gap-3">
              <div className="text-[12px] text-[#98a2b3]">
                {bootstrap.current_detail
                  ? `${bootstrap.current_detail.turn_count} 轮 · ${bootstrap.current_detail.message_count} 条消息`
                  : "等待第一条输入"}
              </div>
              <button
                type="button"
                onClick={() =>
                  transcriptRef.current?.scrollTo({ top: 0, behavior: "smooth" })
                }
                className="h-[32px] rounded-[8px] border border-[#dbe5f0] bg-white px-3 text-[12px] font-medium text-[#356da8] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
              >
                回到顶部
              </button>
            </div>
          </div>
          <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {bootstrap.current_detail?.turns.length ? (
                bootstrap.current_detail.turns.map((turn) => (
                  <div key={turn.anchor} id={turn.anchor}>
                    <TurnCard turn={turn} />
                  </div>
                ))
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#d6e0eb] bg-[#fafbfd] px-4 py-10 text-center text-[13px] leading-6 text-[#7f8ea3]">
                  当前还没有对话内容。可以直接在下方输入消息开始一个新会话。
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <BotConfigPanel
        workspacePath={bootstrap.workspace_path}
        configPath={bootstrap.agent.config_path || ""}
        securityListPath={bootstrap.security_list.path || "security_list.json"}
        writeAllowText={bootstrap.security_list.write_allow_text || ""}
        readDenyText={bootstrap.security_list.read_deny_text || ""}
        onEdit={(kind) => void handleOpenEditor(kind)}
      />

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
    </section>
  );
}
