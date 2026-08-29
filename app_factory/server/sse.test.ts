import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { formatSseEvent } from "./sse.ts";

test("SSE 事件包含 id、事件类型和 JSON 数据", () => {
  assert.equal(
    formatSseEvent({
      id: "run-1:2",
      event: "harness",
      data: { runId: "run-1", sequence: 2, type: "text", content: "完成" },
    }),
    'id: run-1:2\nevent: harness\ndata: {"runId":"run-1","sequence":2,"type":"text","content":"完成"}\n\n',
  );
});

test("SSE 文本数据按行安全编码", () => {
  assert.equal(formatSseEvent({ data: "第一行\n第二行" }), "data: 第一行\ndata: 第二行\n\n");
});
