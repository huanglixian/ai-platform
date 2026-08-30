import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { buildWorkspaceRunSummaries, getWorkspaceHistoryEvents, getWorkspaceRunStepCount, mergeWorkspaceEvents, shouldShowRunSummary, type WorkspaceEvent } from "./workspace-events.ts";

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

test("工具准备调用保留在同一运行的执行过程列表中", () => {
  const merged = mergeWorkspaceEvents([
    {
      type: "activity",
      content: "准备调用 write",
      runId: "run-prepare",
      sequence: 1,
      activity: {
        id: "call-write",
        kind: "write",
        status: "started",
        toolName: "write",
      },
    },
    {
      type: "activity",
      content: "正在创建 app/about/page.tsx",
      runId: "run-prepare",
      sequence: 2,
      activity: {
        id: "call-write",
        kind: "write",
        status: "started",
        toolName: "write",
        path: "app/about/page.tsx",
      },
    },
    {
      type: "activity",
      content: "已创建 app/about/page.tsx",
      runId: "run-prepare",
      sequence: 3,
      activity: {
        id: "call-write",
        kind: "write",
        status: "completed",
        toolName: "write",
        path: "app/about/page.tsx",
      },
    },
  ]);

  assert.deepEqual(merged.map((event) => event.content), [
    "准备调用 write",
    "已创建 app/about/page.tsx",
  ]);
  assert.equal(
    getWorkspaceRunStepCount({
      runId: "run-prepare",
      activities: merged,
      status: "completed",
    }),
    1,
  );
});

test("同一运行的工具步骤聚合为一张运行摘要卡", () => {
  const summaries = buildWorkspaceRunSummaries([
    {
      type: "activity",
      content: "已修改 app/page.tsx",
      runId: "run-2",
      sequence: 1,
      activity: { id: "edit-1", kind: "edit", status: "completed", path: "app/page.tsx" },
    },
    { type: "text", content: "修改已完成", runId: "run-2", sequence: 2 },
    { type: "completed", content: "任务完成", runId: "run-2", sequence: 3 },
  ]);

  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].runId, "run-2");
  assert.equal(summaries[0].status, "completed");
  assert.deepEqual(
    summaries[0].activities.map((event) => event.content),
    ["已修改 app/page.tsx"],
  );
});

test("进行中运行的步骤和终态不重复出现在外层消息流", () => {
  const visible = getWorkspaceHistoryEvents(
    [
      {
        type: "activity",
        content: "正在执行 bash",
        runId: "run-3",
        activity: { id: "bash-1", kind: "command", status: "started" },
      },
      { type: "text", content: "结果如下", runId: "run-3" },
      { type: "completed", content: "任务完成", runId: "run-3" },
    ],
    "run-3",
  );

  assert.deepEqual(visible.map((event) => event.type), ["text"]);
});

test("历史消息不展示旧版 Pi 的诊断和内部完成标记", () => {
  const visible = getWorkspaceHistoryEvents([
    {
      type: "text",
      content:
        "Warning: No project session found with id 'session-old'; creating a new session with that id.\n",
    },
    { type: "text", content: "已修改文件：`app/page.tsx`" },
    { type: "completed", content: "session-old completed" },
    { type: "text", content: "LLM 连接成功\n" },
    { type: "user", content: "连接测试" },
    { type: "user", content: "连接测试", runId: "run-4", sequence: 0 },
    { type: "text", content: "连接已验证，可以开始工作。", runId: "run-4" },
  ]);

  assert.deepEqual(visible, [
    { type: "user", content: "连接测试", runId: "run-4", sequence: 0 },
    { type: "text", content: "连接已验证，可以开始工作。", runId: "run-4" },
  ]);
});

test("没有工具步骤的成功问答不重复显示执行摘要卡", () => {
  assert.equal(
    shouldShowRunSummary({ runId: "run-5", activities: [], status: "completed" }),
    false,
  );
  assert.equal(
    shouldShowRunSummary({ runId: "run-6", activities: [], status: "failed" }),
    true,
  );
  assert.equal(
    shouldShowRunSummary({
      runId: "run-7",
      activities: [
        {
          type: "activity",
          content: "已读取 app/page.tsx",
          activity: { id: "read-1", kind: "read", status: "completed" },
        },
      ],
      status: "completed",
    }),
    true,
  );
});
