"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  getNanobotBootstrap,
  getNanobotSessionDetail,
  saveNanobotSecurityList,
  sendNanobotMessage,
} from "@/features/bots/api";
import type {
  NanobotBootstrap,
  NanobotMessageView,
  NanobotTurnView,
} from "@/features/bots/types";

type BotWorkbenchProps = {
  agentId: string;
};

function PendingTurn({ content }: { content: string }) {
  return (
    <section className="rounded-[12px] border border-[#d8e8fa] bg-[#f8fbfe] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold text-title">正在处理</div>
        <div className="text-[12px] text-[#7f8ea3]">等待后端返回结果</div>
      </div>
      <div className="mt-3 grid gap-3">
        <article className="rounded-[10px] border border-[#e4edf6] bg-white p-3">
          <div className="text-[11px] font-medium text-[#7f8ea3]">用户</div>
          <pre className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-6 text-title">
            {content}
          </pre>
        </article>
        <article className="rounded-[10px] border border-[#d8e8fa] bg-[#eef5fd] p-3">
          <div className="text-[11px] font-medium text-[#356da8]">助手</div>
          <pre className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-6 text-[#1a4d87]">
            nanobot 正在思考，请稍候...
          </pre>
        </article>
      </div>
    </section>
  );
}

function MessageCard({ message }: { message: NanobotMessageView }) {
  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";

  return (
    <article
      className={[
        "rounded-[10px] border p-3",
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
            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
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
        <div className="mt-2 rounded-[8px] bg-white/80 px-2.5 py-2 text-[12px] text-[#51657d]">
          {message.tool_summary}
        </div>
      ) : null}
      <pre className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-6 text-title">
        {message.content || "(empty)"}
      </pre>
    </article>
  );
}

function TurnCard({ turn }: { turn: NanobotTurnView }) {
  return (
    <section className="rounded-[12px] border border-[#e4edf6] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-title">
            第 {turn.index} 轮
          </div>
          <div className="mt-1 text-[12px] text-[#7f8ea3]">{turn.title}</div>
        </div>
        <div className="text-[12px] text-[#98a2b3]">{turn.timestamp || "-"}</div>
      </div>
      <div className="mt-4 grid gap-3">
        {turn.user_message ? <MessageCard message={turn.user_message} /> : null}
        {turn.process_messages.length ? (
          <details className="rounded-[10px] border border-[#edf2f7] bg-[#fafbfd]">
            <summary className="cursor-pointer px-3 py-2.5 text-[12px] font-medium text-[#51657d]">
              思考过程（{turn.process_messages.length} 条）
            </summary>
            <div className="grid gap-3 border-t border-[#edf2f7] p-3">
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
  const [bootstrap, setBootstrap] = useState<NanobotBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const [composerValue, setComposerValue] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingContent, setPendingContent] = useState("");
  const [composerStatus, setComposerStatus] = useState("");
  const [writeAllowText, setWriteAllowText] = useState("");
  const [readDenyText, setReadDenyText] = useState("");
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securityStatus, setSecurityStatus] = useState("");

  function syncUrl(nextSessionKey = "", anchor = "") {
    const url = new URL(window.location.href);
    if (nextSessionKey) {
      url.searchParams.set("session_key", nextSessionKey);
    } else {
      url.searchParams.delete("session_key");
    }
    url.searchParams.delete("new");
    url.hash = anchor ? `#${anchor}` : "";
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
      }

      setComposerStatus("");
      syncUrl(sessionKey, anchor);
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
    setPendingContent(content);
    setComposerStatus("");

    try {
      const data = await sendNanobotMessage(agentId, {
        content,
        session_key: bootstrap.current_key || "",
      });
      setBootstrap({
        ...bootstrap,
        sessions: data.sessions || [],
        current_key: data.session_key,
        current_detail: data.detail,
      });
      setComposerValue("");
      syncUrl(data.session_key);
    } catch (sendError) {
      setComposerStatus(
        sendError instanceof Error ? sendError.message : "发送失败，请重试",
      );
    } finally {
      setSending(false);
      setPendingContent("");
    }
  }

  async function handleSaveSecurity() {
    if (!bootstrap) {
      return;
    }

    setSavingSecurity(true);
    setSecurityStatus("");

    try {
      const data = await saveNanobotSecurityList(agentId, {
        write_allow_text: writeAllowText,
        read_deny_text: readDenyText,
      });
      setBootstrap({
        ...bootstrap,
        security_list: {
          ...bootstrap.security_list,
          ...data,
        },
      });
      setSecurityStatus("已保存");
    } catch (saveError) {
      setSecurityStatus(
        saveError instanceof Error ? saveError.message : "保存失败，请检查后端日志",
      );
    } finally {
      setSavingSecurity(false);
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
        setWriteAllowText(data.security_list.write_allow_text || "");
        setReadDenyText(data.security_list.read_deny_text || "");
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
    <div className="flex w-full flex-col gap-4">
      <section className="app-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#e7eef6] bg-[linear-gradient(180deg,#f2f7fd_0%,#eef4fb_100%)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/bots"
                className="rounded-[8px] border border-[#dbe5f0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#51657d] transition-colors hover:border-[#bfd7f2] hover:text-title"
              >
                返回列表
              </Link>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#7f8ea3]">
                自由体工作台
              </div>
            </div>
            <div className="mt-3 text-title text-[22px] font-semibold tracking-[-0.02em]">
              {bootstrap.agent.name || bootstrap.agent.id}
            </div>
            <div className="mt-1 text-[12px] text-[#7f8ea3]">
              {bootstrap.agent.id}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[10px] bg-white px-4 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
                模型
              </div>
              <div className="mt-1 text-[13px] font-semibold text-title">
                {bootstrap.model_name || "-"}
              </div>
            </div>
            <div className="rounded-[10px] bg-white px-4 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
                版本
              </div>
              <div className="mt-1 text-[13px] font-semibold text-title">
                {bootstrap.app_version ? `v${bootstrap.app_version}` : "-"}
              </div>
            </div>
            <div className="rounded-[10px] bg-white px-4 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
                会话
              </div>
              <div className="mt-1 text-[13px] font-semibold text-title">
                {bootstrap.sessions.length} 个
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 px-5 py-4 text-[12px] text-[#51657d] lg:grid-cols-2">
          <div className="rounded-[10px] bg-[#f8fbfe] px-4 py-3">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
              workspace
            </div>
            <div className="mt-1 break-all">{bootstrap.workspace_path || "-"}</div>
          </div>
          <div className="rounded-[10px] bg-[#f8fbfe] px-4 py-3">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
              config
            </div>
            <div className="mt-1 break-all">{bootstrap.agent.config_path || "-"}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="app-card flex min-h-[680px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
            <div>
              <div className="text-[15px] font-semibold text-title">会话列表</div>
              <div className="mt-1 text-[12px] text-[#7f8ea3]">
                共 {bootstrap.sessions.length} 个
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setBootstrap({
                  ...bootstrap,
                  current_key: null,
                  current_detail: null,
                });
                setComposerStatus("");
                syncUrl();
              }}
              className="h-[32px] rounded-[8px] border border-[#dbe5f0] px-3 text-[12px] font-medium text-[#356da8] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
            >
              新会话
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {bootstrap.sessions.length ? (
              bootstrap.sessions.map((session) => {
                const active = session.key === bootstrap.current_key;
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
                        <div className="line-clamp-2 text-[13px] font-semibold text-title">
                          {session.title || session.key}
                        </div>
                        <div className="mt-1 truncate text-[11px] text-[#98a2b3]">
                          {session.key}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-[#7f8ea3]">
                        <div>{session.turn_count} 轮</div>
                        <div className="mt-1">{session.updated_label || "-"}</div>
                      </div>
                    </button>
                    {active ? (
                      <div className="border-t border-[#eef2f6] px-3 py-3">
                        <div className="line-clamp-2 text-[12px] leading-5 text-[#667085]">
                          {session.preview || "当前没有预览"}
                        </div>
                        <div className="mt-3 grid gap-2">
                          {session.turns.length ? (
                            session.turns.map((turn) => (
                              <button
                                key={`${session.key}-${turn.anchor}`}
                                type="button"
                                onClick={() =>
                                  void handleOpenSession(session.key, turn.anchor)
                                }
                                className="flex items-center justify-between gap-3 rounded-[8px] border border-[#edf2f7] bg-white px-2.5 py-2 text-left transition-colors hover:border-[#d8e8fa] hover:bg-[#eef5fd]"
                              >
                                <span className="min-w-0 truncate text-[12px] text-title">
                                  {turn.title}
                                </span>
                                <span className="text-[11px] text-[#98a2b3]">
                                  #{turn.index}
                                </span>
                              </button>
                            ))
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

        <div className="grid min-w-0 gap-4">
          <section className="app-card min-h-[520px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
              <div>
                <div className="text-[15px] font-semibold text-title">对话记录</div>
                <div className="mt-1 text-[12px] text-[#7f8ea3]">
                  {bootstrap.current_detail
                    ? `${bootstrap.current_detail.turn_count} 轮 · ${bootstrap.current_detail.message_count} 条消息`
                    : "等待第一条输入"}
                </div>
              </div>
              <div className="text-[12px] text-[#98a2b3]">
                {bootstrap.current_key || "新会话"}
              </div>
            </div>
            <div className="space-y-4 px-4 py-4">
              {pendingContent ? <PendingTurn content={pendingContent} /> : null}
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
          </section>

          <section className="app-card overflow-hidden">
            <div className="border-b border-[#eef2f6] px-4 py-3">
              <div className="text-[15px] font-semibold text-title">消息输入</div>
              <div className="mt-1 text-[12px] text-[#7f8ea3]">
                直接调用 nanobot 后端聊天接口，结果会写入当前工作区会话。
              </div>
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
                placeholder="输入消息，回车发送，Shift + Enter 换行"
                className="min-h-[140px] resize-y rounded-[12px] border border-[#dbe5f0] bg-white px-4 py-3 text-[13px] leading-6 text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#7f8ea3]">
                  Workspace：{bootstrap.workspace_path || "-"}
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
              {composerStatus ? (
                <div className="text-[12px] text-[#7f8ea3]">{composerStatus}</div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="app-card flex min-h-[680px] flex-col overflow-hidden">
          <div className="border-b border-[#eef2f6] px-4 py-3">
            <div className="text-[15px] font-semibold text-title">名单配置</div>
            <div className="mt-1 text-[12px] text-[#7f8ea3]">
              对应后端 `security_list.json` 的可编辑内容。
            </div>
          </div>
          <div className="grid flex-1 gap-4 px-4 py-4">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-[#7f8ea3]">
                允许写入
              </span>
              <textarea
                value={writeAllowText}
                onChange={(event) => setWriteAllowText(event.target.value)}
                className="min-h-[180px] resize-y rounded-[12px] border border-[#dbe5f0] bg-white px-4 py-3 font-mono text-[12px] leading-6 text-title outline-none transition-colors focus:border-[#6f96c4]"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-medium text-[#7f8ea3]">
                禁止读取
              </span>
              <textarea
                value={readDenyText}
                onChange={(event) => setReadDenyText(event.target.value)}
                className="min-h-[180px] resize-y rounded-[12px] border border-[#dbe5f0] bg-white px-4 py-3 font-mono text-[12px] leading-6 text-title outline-none transition-colors focus:border-[#6f96c4]"
              />
            </label>
            <div className="mt-auto flex items-center justify-between gap-3">
              <div className="text-[12px] text-[#7f8ea3]">
                {savingSecurity ? "正在保存名单配置..." : securityStatus || " "}
              </div>
              <button
                type="button"
                disabled={savingSecurity}
                onClick={() => void handleSaveSecurity()}
                className="h-[36px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
              >
                {savingSecurity ? "保存中..." : "保存配置"}
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
