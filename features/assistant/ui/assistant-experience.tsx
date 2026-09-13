"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { MessageMarkdown } from "@/components/shared/message-markdown";
import { streamAssistantChat } from "../client";
import type { AssistantChatMessage, AssistantRuntimeState } from "../chat-types";
import { AssistantComposer } from "./assistant-composer";
import { AssistantConversationShell } from "./assistant-conversation-shell";
import { AssistantEntry } from "./assistant-entry";
import { AssistantOutcome } from "./assistant-outcome";
import { listAssistantKnowledge, searchAssistantKnowledge, type KnowledgeOption } from "../knowledge-client";
import type { RetrievalSearchResult } from "@/knowhub/features/retrieval/types";
import { RetrievalResultsPanel } from "@/knowhub/components/retrieval/retrieval-results-panel";

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
  const renderedElements: ReactNode[] = [];
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

function ChatMessageCard({ message, onReturnHome }: { message: AssistantChatMessage; onReturnHome: () => void }) {
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
        {isUser ? "我" : "AI 助手"}
      </div>
      {isUser ? (
        <div className="whitespace-pre-wrap text-[13px] leading-6 text-title">
          {message.content}
        </div>
      ) : (
        <>
          <AssistantMessageContent content={message.content} />
          {message.outcome ? <AssistantOutcome outcome={message.outcome} onReturnHome={onReturnHome} /> : null}
        </>
      )}
    </article>
  );
}

type AssistantExperienceProps = {
  onConversationChange: (active: boolean) => void;
};

export function AssistantExperience({ onConversationChange }: AssistantExperienceProps) {
  const [mode, setMode] = useState<"chat" | "search">("chat");
  const [searchActive, setSearchActive] = useState(false);
  const [knowledgeOptions, setKnowledgeOptions] = useState<KnowledgeOption[]>([]);
  const [knowledgeId, setKnowledgeId] = useState("");
  const [knowledgeError, setKnowledgeError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState<RetrievalSearchResult | null>(null);
  const requestVersion = useRef(0);
  useEffect(() => {
    let active = true;
    listAssistantKnowledge().then((items) => {
      if (!active) return;
      setKnowledgeOptions(items);
      setKnowledgeId(items[0]?.id || "");
    }).catch((error: Error) => { if (active) setKnowledgeError(error.message); });
    return () => { active = false; };
  }, []);

  async function handleSearch(content: string) {
    if (searching || !content.trim()) return;
    if (!knowledgeId) { setSearchError("请先选择一个已发布的知识库"); return; }
    const version = ++requestVersion.current;
    setSearchInput(content.trim());
    setSearchActive(true);
    onConversationChange(true);
    setSearching(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const result = await searchAssistantKnowledge(knowledgeId, content.trim());
      if (version === requestVersion.current) setSearchResult(result);
    } catch (error) {
      if (version === requestVersion.current) setSearchError(error instanceof Error ? error.message : "搜索失败");
    } finally {
      if (version === requestVersion.current) setSearching(false);
    }
  }
  const [chatMessages, setChatMessages] = useState<AssistantChatMessage[]>([]);
  const [runtimeState, setRuntimeState] = useState<AssistantRuntimeState>({ skillStatus: "idle" });
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatStatus, setChatStatus] = useState("正在理解你的任务");
  const [chatError, setChatError] = useState("");
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  async function handleChat(content: string) {
    const query = content.trim();

    if (!query || chatSending) {
      return;
    }

    const userMessage: AssistantChatMessage = {
      id: createMessageId(),
      role: "user",
      content: query,
    };
    const assistantMessage: AssistantChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: "",
    };
    const nextMessages = [...chatMessages, userMessage, assistantMessage];

    onConversationChange(true);
    setChatMessages(nextMessages);
    setChatInput("");
    setChatSending(true);
    setChatError("");
    setChatStatus("回复生成中...");

    try {
      let assistantContent = "";
      const response = await streamAssistantChat(
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
      assistantContent = response.content;

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
            ? { ...message, content: cleanContent, outcome: response.outcome }
            : message,
        ),
      );

      setChatStatus("");
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "AI 助手回复失败";
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

  useEffect(() => {
    if (!chatMessages.length) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const container = chatScrollRef.current;

      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [chatMessages]);

  function leaveConversation() {
    requestVersion.current += 1;
    setSearchActive(false);
    setSearching(false);
    setSearchResult(null);
    setSearchError("");
    setChatMessages([]);
    setChatInput("");
    setChatError("");
    setChatStatus("正在理解你的任务");
    setRuntimeState({ skillStatus: "idle" });
    onConversationChange(false);
  }

  if (searchActive) {
    return <AssistantConversationShell header={
      <header className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-[#244e70]">知识库搜索</span>
        <select aria-label="选择知识库" disabled={searching} value={knowledgeId} onChange={(event) => setKnowledgeId(event.target.value)} className="h-8 max-w-[240px] rounded-lg border border-[#d6e3ee] bg-white px-2 text-xs">{knowledgeOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <button type="button" onClick={leaveConversation} className="ml-auto rounded-lg border border-[#d6e3ee] px-3 py-1.5 text-xs text-[#526e85]">返回首页</button>
      </header>
    } commandPanel={<AssistantComposer value={searchInput} onChange={setSearchInput} onSubmit={handleSearch} placeholder="输入问题，搜索知识库…" sending={searching} status={searching ? "正在检索相关片段…" : "搜索已发布知识库中的文档片段"} submitLabel="搜索" sendingLabel="搜索中" error={searchError} />}>
      {searching ? <p role="status" className="text-sm text-[#617a91]">正在检索相关片段…</p> : null}
      <RetrievalResultsPanel visible={!searching && searchResult !== null} items={searchResult?.items ?? []} />
    </AssistantConversationShell>;
  }

  if (!chatMessages.length) {
    return (
      <AssistantEntry sending={chatSending || searching} mode={mode} onModeChange={setMode} knowledgeOptions={knowledgeOptions} knowledgeId={knowledgeId} onKnowledgeChange={setKnowledgeId} error={mode === "search" ? knowledgeError || searchError : undefined} onSend={mode === "chat" ? handleChat : handleSearch} />
    );
  }

  return (
    <AssistantConversationShell
      contentRef={chatScrollRef}
      header={
        <header className="flex items-center gap-3 px-1 py-1">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9f4fd] text-[#0368b3]"><Sparkles size={17} /></div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-title">AI 助手</div>
            <div className="text-[11px] text-[#7890a8]">理解任务并协助连接平台能力</div>
          </div>
          <button type="button" onClick={leaveConversation} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#dce7f1] px-3 text-[12px] font-medium text-[#617a91] transition-colors hover:border-[#b8d1e9] hover:bg-[#f7fbfe] hover:text-[#1a5c96]"><ArrowLeft size={14} />返回首页</button>
        </header>
      }
      commandPanel={
        <AssistantComposer
          value={chatInput}
          placeholder="继续描述任务…"
          sending={chatSending}
          status={chatStatus}
          submitLabel="发送"
          sendingLabel="生成中..."
          error={chatError}
          onChange={setChatInput}
          onSubmit={handleChat}
        />
      }
    >
        <div className="flex flex-col gap-3">
          {chatMessages.map((message) => (
            <ChatMessageCard key={message.id} message={message} onReturnHome={leaveConversation} />
          ))}
        </div>
    </AssistantConversationShell>
  );
}
