import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { parseSseBlock } from "./sse.ts";

test("解析带 id、类型和 JSON 数据的 SSE 事件", () => {
  assert.deepEqual(
    parseSseBlock(
      'id: run-1:2\nevent: harness\ndata: {"type":"text","content":"你好"}',
    ),
    {
      id: "run-1:2",
      event: "harness",
      data: { type: "text", content: "你好" },
    },
  );
});

test("忽略注释并合并多行 SSE 数据", () => {
  assert.deepEqual(parseSseBlock(": heartbeat\ndata: 第一行\ndata: 第二行"), {
    data: "第一行\n第二行",
  });
});
