import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { parseTranscript } from "./transcript.ts";

test("会话记录只保留有效的 Harness 事件", () => {
  assert.deepEqual(
    parseTranscript(
      '{"type":"user","content":"创建页面"}\n无效行\n{"type":"completed","content":"完成"}\n',
    ),
    [
      { type: "user", content: "创建页面" },
      { type: "completed", content: "完成" },
    ],
  );
});
