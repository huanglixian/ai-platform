"use client";

import { useEffect, useRef, useState } from "react";

import { MessageMarkdown } from "@/components/shared/message-markdown";
import { WorkbenchCommandPanel } from "@/components/workbench/workbench-command-panel";
import { WorkbenchEmptyState } from "@/components/workbench/workbench-empty-state";
import { WorkbenchSearchResultPane } from "@/components/workbench/workbench-search-result-pane";
import { WorkbenchShell } from "@/components/workbench/workbench-shell";
import {
  listWorkbenchKnowledgeOptions,
  searchWorkbenchKnowledge,
  streamWorkbenchChat,
  type WorkbenchChatMessage,
  type WorkbenchKnowledgeOption,
  type WorkbenchSearchResult,
} from "@/features/workbench/api";

type WorkbenchMode = "search" | "chat";
type JsonRecord = Record<string, unknown>;
type ToolData = { name: string; args?: unknown; result?: JsonRecord };
type ParsedPart =
  | { type: "text"; content: string }
  | { type: "tool_call"; content: string; data: ToolData }
  | { type: "tool_result"; content: string; data: ToolData };

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function isToolData(value: unknown): value is ToolData {
  return isRecord(value) && typeof value.name === "string";
}

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseAssistantMessageSafe(content: string) {
  const parts: ParsedPart[] = [];
  let currentIndex = 0;

  while (currentIndex < content.length) {
    const callIdx = content.indexOf("[CALL_TOOL:", currentIndex);
    const resultIdx = content.indexOf("[RESULT_TOOL:", currentIndex);

    let foundIdx = -1;
    let type: "tool_call" | "tool_result" = "tool_call";
    let prefixLen = 0;

    if (callIdx !== -1 && (resultIdx === -1 || callIdx < resultIdx)) {
      foundIdx = callIdx;
      type = "tool_call";
      prefixLen = "[CALL_TOOL:".length;
    } else if (resultIdx !== -1 && (callIdx === -1 || resultIdx < callIdx)) {
      foundIdx = resultIdx;
      type = "tool_result";
      prefixLen = "[RESULT_TOOL:".length;
    }

    if (foundIdx === -1) {
      const text = content.slice(currentIndex);
      if (text) {
        parts.push({ type: "text", content: text });
      }
      break;
    }

    const prevText = content.slice(currentIndex, foundIdx);
    if (prevText) {
      parts.push({ type: "text", content: prevText });
    }

    let endIdx = -1;
    let braceCount = 0;
    let inString = false;
    let escaped = false;

    // 状态机扫描 JSON 结束位置，解决正则回溯崩溃问题
    for (let k = foundIdx + prefixLen; k < content.length; k++) {
      const char = content[k];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
        } else if (char === "]" && braceCount === 0) {
          endIdx = k;
          break;
        }
      }
    }

    if (endIdx === -1) {
      const incompleteText = content.slice(foundIdx);
      parts.push({ type: "text", content: incompleteText });
      break;
    }

    const jsonStr = content.slice(foundIdx + prefixLen, endIdx);
    const fullMatchText = content.slice(foundIdx, endIdx + 1);

    try {
      const data: unknown = JSON.parse(jsonStr);
      if (isToolData(data)) {
        parts.push({ type, content: fullMatchText, data });
      } else {
        parts.push({ type: "text", content: fullMatchText });
      }
    } catch {
      parts.push({ type: "text", content: fullMatchText });
    }

    currentIndex = endIdx + 1;
  }

  return parts;
}

function ToolResultView({ name, result }: { name: string; result: JsonRecord | null | undefined }) {
  if (!result || result.success === false) {
    return <div className="text-[#d32f2f] font-sans">调用失败：{String(result?.error || "未知接口错误")}</div>;
  }

  const dataList = result.data;
  // 特别针对杆塔匹配服务结果进行精美的表格化展示
  if (name === "tower.match.search" && Array.isArray(dataList) && dataList.length > 0) {
    return (
      <div className="mt-2 overflow-x-auto rounded border border-[#e2eaf2] font-sans">
        <table className="w-full border-collapse text-left text-[11px] text-[#4f5e71]">
          <thead>
            <tr className="bg-[#f4f7fa] border-b border-[#e2eaf2] font-semibold text-title">
              <th className="px-3 py-1.5 whitespace-nowrap">序号</th>
              <th className="px-3 py-1.5 whitespace-nowrap">杆塔名称</th>
              <th className="px-3 py-1.5 whitespace-nowrap">类型</th>
              <th className="px-3 py-1.5 whitespace-nowrap">电压等级</th>
              <th className="px-3 py-1.5 whitespace-nowrap">材质</th>
              <th className="px-3 py-1.5 whitespace-nowrap">呼高 (m)</th>
              <th className="px-3 py-1.5 whitespace-nowrap">总重量 (kg)</th>
              <th className="px-3 py-1.5 whitespace-nowrap">匹配得分</th>
            </tr>
          </thead>
          <tbody>
            {dataList.map((rawItem, idx: number) => {
              const item = isRecord(rawItem) ? rawItem : {};
              const value = (key: string, fallbackKey?: string) => item[key] ?? (fallbackKey ? item[fallbackKey] : undefined);
              return (
              <tr key={idx} className="border-b border-[#e2eaf2] hover:bg-[#fafcfe] last:border-b-0">
                <td className="px-3 py-1.5 whitespace-nowrap">{idx + 1}</td>
                <td className="px-3 py-1.5 font-mono font-bold text-[#2474a6] whitespace-nowrap">
                  {String(value("杆塔名称", "towerName") ?? "")}
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">{String(value("杆塔类型", "towerType") ?? "")}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  {String(value("电压等级", "voltageClass") ?? "")}
                  {String(value("电压等级", "voltageClass") ?? "").toLowerCase().includes("kv") ? "" : "kV"}
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">{String(value("杆塔材质", "towerMaterial") ?? "")}</td>
                <td className="px-3 py-1.5 font-mono whitespace-nowrap">{String(value("呼高", "expectedHeight") ?? "")}</td>
                <td className="px-3 py-1.5 font-mono whitespace-nowrap">
                  {Number.parseFloat(String(value("总重量", "totalWeight") ?? "0")).toLocaleString()}
                </td>
                <td className="px-3 py-1.5 font-mono text-[#2e7d32] whitespace-nowrap">
                  {Number.parseFloat(String(value("match_score", "score") ?? "0")).toFixed(4)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // 通用其它 API 工具结果展示为 JSON 代码块
  return (
    <pre className="max-h-[200px] overflow-auto rounded bg-[#f4f7f9] p-2 whitespace-pre-wrap break-all font-mono text-[11px]">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

function AssistantMessageContent({ content }: { content: string }) {
  const skillCallMatch = content.match(/^调用技能：(.+?)(?:\n|$)/);
  const remainingText = skillCallMatch
    ? content.slice(skillCallMatch[0].length).trimStart()
    : content;

  // 使用基于状态机的高健壮性安全解析器，解决超大JSON正则回溯及流截断报错问题
  const parts = parseAssistantMessageSafe(remainingText);

  // 聚合配对渲染
  const renderedElements: React.ReactNode[] = [];
  let toolIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.type === "text") {
      const text = part.content.trim();
      if (text) {
        renderedElements.push(<MessageMarkdown key={`text-${i}`} content={text} />);
      }
    } else if (part.type === "tool_call") {
      const toolId = `${part.data.name}-${toolIndex++}`;
      let matchedResult: JsonRecord | null = null;

      // 向后寻找对应配对的 result
      for (let j = i + 1; j < parts.length; j++) {
        const candidate = parts[j];
        if (candidate.type === "tool_result" && candidate.data.name === part.data.name) {
          matchedResult = candidate.data.result ?? null;
          parts[j] = { type: "text", content: "" };
          break;
        }
      }

      renderedElements.push(
        <ToolInvocationCard
          key={toolId}
          name={part.data.name}
          args={part.data.args}
          result={matchedResult}
        />,
      );
    }
  }

  return (
    <div>
      {skillCallMatch && (
        <div className="text-[12px] font-medium leading-5 text-[#2474a6] mb-1">
          调用技能：{skillCallMatch[1]}
        </div>
      )}
      {renderedElements.length > 0 ? (
        <div className="flex flex-col gap-1">{renderedElements}</div>
      ) : (
        <div className="text-[#7f8ea3] text-[13px] italic">回复生成中...</div>
      )}
    </div>
  );
}

function ToolInvocationCard({ name, args, result }: { name: string; args?: unknown; result?: JsonRecord | null }) {
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const isPending = !result;
  const isSuccess = result?.success !== false;
  const isExpanded = expanded ?? Boolean(result);

  return (
    <div className="my-2.5 overflow-hidden rounded-[10px] border border-[#e2eaf2] bg-[#f7fafd] text-[13px] leading-5 text-title">
      <div 
        onClick={() => setExpanded(!isExpanded)}
        className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-[#eef4fa] transition-colors"
      >
        <div className="flex items-center gap-2">
          {isPending ? (
            <span className="flex h-4 w-4 animate-spin rounded-full border-2 border-[#2474a6] border-t-transparent" />
          ) : isSuccess ? (
            <span className="text-[#2e7d32]">✅</span>
          ) : (
            <span className="text-[#d32f2f]">⚠️</span>
          )}
          <span className="font-mono font-medium text-[#2474a6]">{name}</span>
          <span className="text-[11px] text-[#7f8ea3]">
            {isPending ? "正在执行..." : isSuccess ? "执行成功" : "执行失败"}
          </span>
        </div>
        <span className="text-[11px] text-[#7f8ea3] hover:text-[#2474a6]">
          {isExpanded ? "收起 ▴" : "详情 ▾"}
        </span>
      </div>
      {isExpanded && (
        <div className="border-t border-[#e2eaf2] bg-white p-3 text-[11px] text-[#4f5e71]">
          {isPending ? (
            <div>
              <div className="mb-1 font-semibold text-[#2474a6] font-sans">输入参数 (Input):</div>
              <pre className="max-h-[150px] overflow-auto rounded bg-[#f4f7f9] p-2 font-mono text-[11px] whitespace-pre-wrap break-all">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              {/* 输入参数折叠区 (details 原生折叠，默认收起) */}
              <details className="group mb-3">
                <summary className="flex cursor-pointer select-none items-center gap-1 text-[11px] text-[#7f8ea3] hover:text-[#2474a6] list-none [&::-webkit-details-marker]:hidden font-sans font-medium">
                  <span className="transition-transform group-open:rotate-90">▸</span>
                  <span>输入参数 (Input)</span>
                </summary>
                <pre className="mt-1.5 max-h-[150px] overflow-auto rounded bg-[#f4f7f9] p-2 font-mono text-[11px] whitespace-pre-wrap break-all text-[#4f5e71]">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </details>

              <div className="mb-1 font-semibold text-[#2474a6] font-sans">返回结果 (Output):</div>
              <ToolResultView name={name} result={result} />
            </div>
          )}
        </div>
      )}
    </div>
  );
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
        <AssistantMessageContent content={message.content} />
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
  const [runtimeState, setRuntimeState] = useState<{
    activeSkillId?: string;
    skillStatus: "idle" | "collecting_input" | "running_tool" | "completed" | "failed";
  }>({ skillStatus: "idle" });
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatStatus, setChatStatus] = useState("描述任务后，工作台 AI 会生成回复。");
  const [chatError, setChatError] = useState("");
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

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
        runtimeState,
        {
          onDelta: (delta) => {
            assistantContent += delta;
            
            // 实时检查并剔除流末尾的 [__STATE__: 标记，防止页面上闪现
            let displayContent = assistantContent;
            const stateIndex = assistantContent.indexOf("[__STATE__:");
            if (stateIndex !== -1) {
              displayContent = assistantContent.slice(0, stateIndex).trimEnd();
            }

            setChatMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: displayContent }
                  : message,
              ),
            );
          },
        },
      );

      // 请求成功结束后，提取 [__STATE__:{...}]
      const stateMatch = assistantContent.match(/\[__STATE__:(\{[\s\S]*?\})\]/);
      if (stateMatch) {
        try {
          const newState = JSON.parse(stateMatch[1]);
          setRuntimeState(newState);
        } catch (e) {
          console.error("解析返回的 runtimeState 失败", e);
        }
      }

      // 提取纯净的回复内容更新最终文本，清除状态标记
      let cleanContent = assistantContent;
      const stateIndex = assistantContent.indexOf("[__STATE__:");
      if (stateIndex !== -1) {
        cleanContent = assistantContent.slice(0, stateIndex).trimEnd();
      }

      setChatMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, content: cleanContent }
            : message,
        ),
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
      <WorkbenchShell
        contentRef={chatScrollRef}
        commandPanel={
          <WorkbenchCommandPanel
            value={chatInput}
            placeholder="继续描述任务，获取工作台 AI 回复"
            sending={chatSending}
            status={chatStatus}
            submitLabel="发送"
            sendingLabel="生成中..."
            error={chatError}
            onChange={setChatInput}
            onSubmit={handleChat}
            onClear={() => {
              setChatMessages([]);
              setChatError("");
              setChatStatus("描述任务后，工作台 AI 会生成回复。");
              setRuntimeState({ skillStatus: "idle" });
            }}
          />
        }
      >
        <div className="flex flex-col gap-3">
          {chatMessages.map((message) => (
            <ChatMessageCard key={message.id} message={message} />
          ))}
        </div>
      </WorkbenchShell>
    );
  }

  return (
    <WorkbenchShell
      commandPanel={
        <WorkbenchCommandPanel
          value={searchInput}
          placeholder="输入问题，搜索知识库中的相关片段"
          sending={searching}
          status={searchStatus || "通过问题召回相关片段和文档索引"}
          submitLabel="搜索"
          sendingLabel="搜索中..."
          error={searchError}
          meta={
            <>
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
              <div className="min-w-0 flex-1 truncate">
                {searchStatus || "通过问题召回相关片段和文档索引"}
              </div>
            </>
          }
          onChange={setSearchInput}
          onSubmit={handleSearch}
          onClear={() => {
            setSearchInput("");
            setSearchResult(null);
            setSearchError("");
            setSearchStatus("");
            setHasSearched(false);
          }}
        />
      }
    >
      <WorkbenchSearchResultPane
        searching={searching}
        query={searchResult?.query || ""}
        knowledgeName={selectedKnowledge?.name || ""}
        hasSearched={hasSearched}
        error={searchError}
        items={searchResult?.items ?? []}
      />
    </WorkbenchShell>
  );
}
