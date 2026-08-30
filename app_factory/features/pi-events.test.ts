import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { normalizePiEvent } from "./pi-events.ts";

const timestamp = "2026-08-30T00:00:00.000Z";

test("工具开始事件显示真实的文件操作", () => {
  assert.deepEqual(
    normalizePiEvent(
      {
        type: "tool_execution_start",
        toolCallId: "call-1",
        toolName: "read",
        args: { path: "app/page.tsx" },
      },
      timestamp,
    ),
    {
      type: "activity",
      content: "正在读取 app/page.tsx",
      timestamp,
      activity: {
        id: "call-1",
        kind: "read",
        status: "started",
        toolName: "read",
        path: "app/page.tsx",
      },
    },
  );
});

test("文本增量保留为 Markdown 内容，思考增量不直接泄露", () => {
  assert.deepEqual(
    normalizePiEvent(
      {
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "## 交付内容" },
      },
      timestamp,
    ),
    { type: "text", content: "## 交付内容", timestamp, stream: "assistant" },
  );
  assert.equal(
    normalizePiEvent(
      {
        type: "message_update",
        assistantMessageEvent: { type: "thinking_delta", contentIndex: 0, delta: "internal reasoning" },
      },
      timestamp,
    ),
    null,
  );
});

test("编辑完成事件带出文件和结果摘要", () => {
  assert.deepEqual(
    normalizePiEvent(
      {
        type: "tool_execution_end",
        toolCallId: "call-2",
        toolName: "edit",
        result: { content: [{ type: "text", text: "Applied 2 edits" }] },
        isError: false,
      },
      timestamp,
      { path: "app/about/page.tsx" },
    ),
    {
      type: "activity",
      content: "已修改 app/about/page.tsx",
      timestamp,
      activity: {
        id: "call-2",
        kind: "edit",
        status: "completed",
        toolName: "edit",
        path: "app/about/page.tsx",
        summary: "Applied 2 edits",
      },
    },
  );
});

test("工具更新事件仍显示为进行中", () => {
  const event = normalizePiEvent(
    {
      type: "tool_execution_update",
      toolCallId: "call-3",
      toolName: "bash",
      args: { command: "npm run typecheck" },
      partialResult: { content: [{ type: "text", text: "正在检查类型" }] },
    },
    timestamp,
  );
  assert.equal(event?.type, "activity");
  assert.equal(event?.content, "正在执行 npm run typecheck");
  assert.equal(event?.activity?.status, "updated");
});
