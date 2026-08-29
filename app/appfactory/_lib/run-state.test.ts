import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { formatRunElapsed, getRunStatusText, type RunFeedback } from "./run-state.ts";

test("运行反馈显示真实等待时长", () => {
  const run: RunFeedback = {
    prompt: "创建一个页面",
    startedAt: 1_000,
    status: "running",
  };
  assert.equal(formatRunElapsed(run, 13_000), "00:12");
  assert.equal(getRunStatusText(run), "请求已提交，正在等待模型和工具执行");
});

test("失败和停止状态使用明确文案", () => {
  assert.equal(
    getRunStatusText({
      prompt: "失败任务",
      startedAt: 1_000,
      status: "failed",
      message: "模型连接失败",
    }),
    "模型连接失败",
  );
  assert.equal(
    getRunStatusText({
      prompt: "停止任务",
      startedAt: 1_000,
      status: "cancelled",
    }),
    "已停止当前任务",
  );
});
