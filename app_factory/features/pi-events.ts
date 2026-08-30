import type {
  HarnessActivity,
  HarnessActivityKind,
  HarnessEvent,
} from "../types/harness";

type PiEvent = Record<string, unknown>;
type ToolInput = { path?: unknown; command?: unknown; pattern?: unknown };

const toolKinds: Record<string, HarnessActivityKind> = {
  read: "read",
  write: "write",
  edit: "edit",
  bash: "command",
  powershell: "command",
  grep: "search",
  find: "search",
  ls: "inspect",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toolInput(event: PiEvent, fallback?: ToolInput): ToolInput {
  const input = asRecord(event.args || event.input);
  return {
    path: input.path ?? fallback?.path,
    command: input.command ?? fallback?.command,
    pattern: input.pattern ?? fallback?.pattern,
  };
}

function displayTarget(toolName: string, input: ToolInput) {
  const path = asText(input.path);
  const command = asText(input.command);
  const pattern = asText(input.pattern);
  if (toolName === "bash" || toolName === "powershell") return { command };
  if (["grep", "find"].includes(toolName)) return { path, pattern };
  return { path };
}

function activityLabel(toolName: string, status: "started" | "updated" | "completed" | "failed", input: ToolInput) {
  const target = displayTarget(toolName, input);
  const inProgress = status === "started" || status === "updated";
  if (toolName === "read") return `${inProgress ? "正在读取" : status === "failed" ? "读取失败" : "已读取"} ${target.path || "文件"}`;
  if (toolName === "write") return `${inProgress ? "正在创建" : status === "failed" ? "创建失败" : "已创建"} ${target.path || "文件"}`;
  if (toolName === "edit") return `${inProgress ? "正在修改" : status === "failed" ? "修改失败" : "已修改"} ${target.path || "文件"}`;
  if (toolName === "bash" || toolName === "powershell") return `${inProgress ? "正在执行" : status === "failed" ? "执行失败" : "已完成"} ${target.command || "命令"}`;
  if (toolName === "grep" || toolName === "find") return `${inProgress ? "正在搜索" : status === "failed" ? "搜索失败" : "已完成搜索"} ${target.pattern || target.path || "项目"}`;
  if (toolName === "ls") return `${inProgress ? "正在查看" : status === "failed" ? "查看失败" : "已查看"} ${target.path || "项目目录"}`;
  return `${inProgress ? "正在调用" : status === "failed" ? "调用失败" : "已完成"} ${toolName}`;
}

export function summarizeToolResult(value: unknown, maxLength = 280) {
  const record = asRecord(value);
  const content = Array.isArray(record.content) ? record.content : [];
  const contentText = content
    .map((item) => asText(asRecord(item).text))
    .filter(Boolean)
    .join("\n");
  const raw = contentText || asText(value);
  if (!raw) return "";
  return raw.length > maxLength ? `${raw.slice(0, maxLength)}…` : raw;
}

function activityEvent(
  event: PiEvent,
  timestamp: string,
  status: HarnessActivity["status"],
  fallbackInput?: ToolInput,
): HarnessEvent {
  const toolName = asText(event.toolName) || "tool";
  const id = asText(event.toolCallId) || `tool-${toolName}`;
  const input = toolInput(event, fallbackInput);
  const target = displayTarget(toolName, input);
  const activity: HarnessActivity = {
    id,
    kind: toolKinds[toolName] || "tool",
    status,
    toolName,
    ...(target.path ? { path: target.path } : {}),
    ...(target.command ? { command: target.command } : {}),
  };
  const summary = summarizeToolResult(event.result ?? event.partialResult);
  if (summary) activity.summary = summary;
  return {
    type: "activity",
    content: activityLabel(toolName, status, input),
    timestamp,
    activity,
  };
}

export function normalizePiEvent(
  value: unknown,
  timestamp = new Date().toISOString(),
  fallbackInput?: ToolInput,
): HarnessEvent | null {
  const event = asRecord(value);
  const type = asText(event.type);

  if (type === "message_update") {
    const update = asRecord(event.assistantMessageEvent);
    const updateType = asText(update.type);
    if (updateType === "text_delta") {
      const delta = typeof update.delta === "string" ? update.delta : "";
      return delta ? { type: "text", content: delta, timestamp, stream: "assistant" } : null;
    }
    if (updateType === "thinking_start") {
      return {
        type: "activity",
        content: "正在整理下一步",
        timestamp,
        activity: {
          id: `thinking-${String(update.contentIndex ?? 0)}`,
          kind: "thinking",
          status: "started",
        },
      };
    }
    if (updateType === "thinking_end") {
      return {
        type: "activity",
        content: "已完成规划",
        timestamp,
        activity: {
          id: `thinking-${String(update.contentIndex ?? 0)}`,
          kind: "thinking",
          status: "completed",
        },
      };
    }
    if (updateType === "toolcall_start") {
      const toolName = asText(update.toolName) || "tool";
      const id = asText(update.id) || `tool-${toolName}`;
      return {
        type: "activity",
        content: `准备调用 ${toolName}`,
        timestamp,
        activity: {
          id,
          kind: toolKinds[toolName] || "tool",
          status: "started",
          toolName,
        },
      };
    }
    return null;
  }

  if (type === "tool_execution_start") return activityEvent(event, timestamp, "started", fallbackInput);
  if (type === "tool_execution_update") return activityEvent(event, timestamp, "updated", fallbackInput);
  if (type === "tool_execution_end") {
    return activityEvent(event, timestamp, event.isError === true ? "failed" : "completed", fallbackInput);
  }
  if (type === "auto_retry_start") {
    return {
      type: "activity",
      content: `模型请求失败，正在重试（${String(event.attempt || 1)}/${String(event.maxAttempts || "?")}）`,
      timestamp,
      activity: {
        id: "model-retry",
        kind: "thinking",
        status: "updated",
        summary: asText(event.errorMessage),
      },
    };
  }
  if (type === "compaction_start") {
    return {
      type: "activity",
      content: "正在整理上下文",
      timestamp,
      activity: { id: "context-compaction", kind: "thinking", status: "started" },
    };
  }
  if (type === "error") {
    return { type: "error", content: asText(event.message) || "Pi 执行失败", timestamp };
  }
  return null;
}
