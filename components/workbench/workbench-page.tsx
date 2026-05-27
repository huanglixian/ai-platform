"use client";

import { useEffect, useRef, useState } from "react";

import { MessageMarkdown } from "@/components/shared/message-markdown";
import { WorkbenchEmptyState } from "@/components/workbench/workbench-empty-state";
import { WorkbenchSearchResultPane } from "@/components/workbench/workbench-search-result-pane";
import {
  listWorkbenchKnowledgeOptions,
  searchWorkbenchKnowledge,
  streamWorkbenchChat,
  type WorkbenchChatMessage,
  type WorkbenchKnowledgeOption,
  type WorkbenchSearchResult,
} from "@/features/workbench/api";

type WorkbenchMode = "search" | "chat";

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ChatMessageCard({ message }: { message: WorkbenchChatMessage }) {
  const isUser = message.role === "user";

  return (
    <article
      className={[
        "rounded-[14px] border px-4 py-3",
        isUser
          ? "ml-auto max-w-[78%] border-[#bfd7f2] bg-[#eef5fd]"
          : "mr-auto max-w-[86%] border-[#e4edf6] bg-white",
      ].join(" ")}
    >
      <div className="mb-1 text-[11px] font-medium text-[#7f8ea3]">
        {isUser ? "用户" : "工作台 AI"}
      </div>
      {isUser ? (
        <div className="whitespace-pre-wrap text-[13px] leading-6 text-title">
          {message.content}
        </div>
      ) : (
        <MessageMarkdown content={message.content || "回复生成中..."} />
      )}
    </article>
  );
}

export function WorkbenchPage() {
  const [mode, setMode] = useState<WorkbenchMode>("chat");
  const [knowledgeOptions, setKnowledgeOptions] = useState<WorkbenchKnowledgeOption[]>([]);
  const [knowledgeId, setKnowledgeId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState<WorkbenchSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [chatMessages, setChatMessages] = useState<WorkbenchChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatStatus, setChatStatus] = useState("描述任务后，工作台 AI 会生成回复。");
  const [chatError, setChatError] = useState("");
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [isChatComposing, setIsChatComposing] = useState(false);

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
      setSearchInput(query);
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

  async function handleChat(content: string) {
    const query = content.trim();

    if (!query || chatSending) {
      return;
    }

    const userMessage: WorkbenchChatMessage = {
      id: createMessageId(),
      role: "user",
      content: query,
    };
    const assistantMessage: WorkbenchChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: "",
    };
    const nextMessages = [...chatMessages, userMessage, assistantMessage];

    setChatMessages(nextMessages);
    setChatInput("");
    setChatSending(true);
    setChatError("");
    setChatStatus("回复生成中...");

    try {
      let assistantContent = "";
      await streamWorkbenchChat(
        nextMessages.filter((message) => message.role !== "assistant" || message.content.trim()),
        {
          onDelta: (delta) => {
            assistantContent += delta;
            setChatMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: assistantContent }
                  : message,
              ),
            );
          },
        },
      );
      setChatStatus("");
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "工作台 AI 回复失败";
      setChatError(message);
      setChatStatus("");
      setChatMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id
            ? { ...item, content: `请求失败：${message}` }
            : item,
        ),
      );
    } finally {
      setChatSending(false);
    }
  }

  function handleModeChange(nextMode: WorkbenchMode) {
    setMode(nextMode);
    if (nextMode === "chat") {
      setSearchError("");
      setSearchStatus("");
    }
  }

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

  useEffect(() => {
    if (mode !== "chat" || !chatMessages.length) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const container = chatScrollRef.current;

      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mode, chatMessages]);

  const showChatWorkspace = mode === "chat" && chatMessages.length > 0;
  const showSearchWorkspace = mode === "search" && hasSearched;
  const selectedKnowledge =
    knowledgeOptions.find((item) => item.id === knowledgeId) ?? null;

  if (!showChatWorkspace && !showSearchWorkspace) {
    return (
      <section className="-ml-6 h-[calc(100vh-104px)] min-h-0 w-[calc(100%+1.5rem)] overflow-hidden rounded-[18px] bg-white px-5 py-4 sm:-ml-8 sm:w-[calc(100%+2rem)]">
        <WorkbenchEmptyState
          mode={mode}
          knowledgeId={knowledgeId}
          knowledgeOptions={knowledgeOptions}
          sending={mode === "chat" ? chatSending : searching}
          status={mode === "chat" ? chatStatus : searchStatus}
          onModeChange={handleModeChange}
          onKnowledgeChange={setKnowledgeId}
          onSend={mode === "chat" ? handleChat : handleSearch}
        />
      </section>
    );
  }

  if (showChatWorkspace) {
    return (
      <section className="-ml-6 h-[calc(100vh-104px)] min-h-0 w-[calc(100%+1.5rem)] py-1 sm:-ml-8 sm:w-[calc(100%+2rem)]">
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-[18px] bg-white px-5 py-4">
          <div
            ref={chatScrollRef}
            className="min-h-0 overflow-y-auto rounded-[14px] border border-[#dbe5f0] bg-[#eef3f8] px-4 py-4"
          >
            <div className="flex flex-col gap-3">
              {chatMessages.map((message) => (
                <ChatMessageCard key={message.id} message={message} />
              ))}
            </div>
          </div>

          <section className="app-card-no-hover overflow-hidden">
            <div className="grid gap-3 px-4 py-4">
              {chatError ? (
                <div className="rounded-[10px] border border-[#f0d2d2] bg-[#fff8f8] px-3 py-2 text-[12px] text-[#a33a3a]">
                  {chatError}
                </div>
              ) : null}
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onCompositionStart={() => setIsChatComposing(true)}
                onCompositionEnd={() => setIsChatComposing(false)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !isChatComposing &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void handleChat(chatInput);
                  }
                }}
                placeholder="继续描述任务，获取工作台 AI 回复"
                className="min-h-[88px] resize-none rounded-[12px] border border-[#dbe5f0] bg-white px-4 py-3 text-[13px] leading-6 text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1 truncate text-[12px] text-[#7f8ea3]">
                  {chatStatus}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChatMessages([]);
                      setChatError("");
                      setChatStatus("描述任务后，工作台 AI 会生成回复。");
                    }}
                    className="h-[36px] rounded-[8px] border border-[#dbe5f0] px-4 text-[13px] font-medium text-[#51657d] transition-colors hover:bg-[#f7fafc]"
                  >
                    清空
                  </button>
                  <button
                    type="button"
                    disabled={chatSending}
                    onClick={() => void handleChat(chatInput)}
                    className="h-[36px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
                  >
                    {chatSending ? "生成中..." : "发送"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="-ml-6 h-[calc(100vh-104px)] min-h-0 w-[calc(100%+1.5rem)] py-1 sm:-ml-8 sm:w-[calc(100%+2rem)]">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-[18px] bg-white px-5 py-4">
        <section className="app-card-no-hover overflow-hidden">
          <div className="border-b border-[#eef2f6] px-4 py-3">
            <div className="text-[15px] font-semibold text-title">知识检索</div>
          </div>
          <div className="grid gap-3 px-4 py-4">
            <textarea
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="输入问题，搜索知识库中的相关片段"
              className="min-h-[92px] resize-none rounded-[12px] border border-[#dbe5f0] bg-white px-4 py-3 text-[13px] leading-6 text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-[12px] text-[#7f8ea3]">
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
              </div>
              <button
                type="button"
                disabled={searching}
                onClick={() => void handleSearch(searchInput)}
                className="h-[36px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
              >
                {searching ? "搜索中..." : "搜索"}
              </button>
            </div>
          </div>
        </section>

        <WorkbenchSearchResultPane
          searching={searching}
          query={searchResult?.query || ""}
          knowledgeName={selectedKnowledge?.name || ""}
          hasSearched={hasSearched}
          error={searchError}
          items={searchResult?.items ?? []}
        />
      </div>
    </section>
  );
}
