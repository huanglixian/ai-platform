import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { deriveSessionTitle, getPiSessionStatus, getPiSessionStatusLabel, getSessionStatusLabel } from "./session.ts";

test("会话标题从首条需求生成并限制长度", () => {
  assert.equal(deriveSessionTitle("  创建一个设备巡检看板  "), "创建一个设备巡检看板");
  assert.equal(deriveSessionTitle(" "), "新对话");
  assert.equal(
    deriveSessionTitle("这是一个需要被截断的超长需求描述，用来验证会话列表不会被一条长消息撑坏"),
    "这是一个需要被截断的超长需求描述，用来验证会话列表不会被一条长消息…",
  );
});

test("会话状态使用用户可读的稳定文案", () => {
  assert.equal(getSessionStatusLabel("running"), "处理中");
  assert.equal(getSessionStatusLabel("error"), "需关注");
  assert.equal(getSessionStatusLabel("idle"), "已就绪");
  assert.equal(getSessionStatusLabel("unknown"), "已就绪");
});

test("Pi 会话健康状态区分未开始、可恢复和上下文缺失", () => {
  assert.equal(getPiSessionStatus({ hasTranscript: false, hasPiSession: false }), "new");
  assert.equal(getPiSessionStatus({ hasTranscript: true, hasPiSession: true }), "ready");
  assert.equal(getPiSessionStatus({ hasTranscript: true, hasPiSession: false }), "missing");
  assert.equal(getPiSessionStatusLabel("new"), "未开始");
  assert.equal(getPiSessionStatusLabel("ready"), "上下文已保存");
  assert.equal(getPiSessionStatusLabel("missing"), "上下文缺失");
});
