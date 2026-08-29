import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { buildFileTree, defaultFileTab } from "./project-ui.ts";

test("文件树按目录聚合并标记被修改的文件", () => {
  assert.deepEqual(buildFileTree(["app/page.tsx", "app/ui/card.tsx", "package.json"], ["app/page.tsx"]), [
    {
      name: "app",
      path: "app",
      type: "folder",
      changed: true,
      children: [
        { name: "page.tsx", path: "app/page.tsx", type: "file", changed: true },
        {
          name: "ui",
          path: "app/ui",
          type: "folder",
          changed: false,
          children: [{ name: "card.tsx", path: "app/ui/card.tsx", type: "file", changed: false }],
        },
      ],
    },
    { name: "package.json", path: "package.json", type: "file", changed: false },
  ]);
});

test("修改过的文件默认打开变更视图，其他文件默认打开内容视图", () => {
  assert.equal(defaultFileTab("app/page.tsx", ["app/page.tsx"]), "diff");
  assert.equal(defaultFileTab("package.json", ["app/page.tsx"]), "content");
});
