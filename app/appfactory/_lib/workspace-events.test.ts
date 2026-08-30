import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { mergeWorkspaceEvents, type WorkspaceEvent } from "./workspace-events.ts";

test("同一工具活动跨越文本输出时仍合并为一个完成步骤", () => {
  const events: WorkspaceEvent[] = [
    {
      type: "activity",
      content: "正在读取 app/page.tsx",
      runId: "run-1",
      sequence: 1,
      activity: { id: "call-1", kind: "read", status: "started", path: "app/page.tsx" },
    },
    { type: "text", content: "我已读取文件", runId: "run-1", sequence: 2 },
    {
      type: "activity",
      content: "已读取 app/page.tsx",
      runId: "run-1",
      sequence: 3,
      activity: { id: "call-1", kind: "read", status: "completed", path: "app/page.tsx", summary: "读取成功" },
    },
  ];

  assert.deepEqual(mergeWorkspaceEvents(events), [
    {
      type: "activity",
      content: "已读取 app/page.tsx",
      runId: "run-1",
      sequence: 3,
      activity: { id: "call-1", kind: "read", status: "completed", path: "app/page.tsx", summary: "读取成功" },
    },
    { type: "text", content: "我已读取文件", runId: "run-1", sequence: 2 },
  ]);
});
