import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { isWorkspaceEntryVisible } from "./workspace.ts";

test("文件列表忽略依赖和构建产物目录", () => {
  assert.equal(isWorkspaceEntryVisible("node_modules"), false);
  assert.equal(isWorkspaceEntryVisible(".next"), false);
  assert.equal(isWorkspaceEntryVisible("out"), false);
  assert.equal(isWorkspaceEntryVisible("app"), true);
  assert.equal(isWorkspaceEntryVisible("app/page.tsx"), true);
});
