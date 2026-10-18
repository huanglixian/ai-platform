import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { DEFAULT_SKIN, SKIN_STORAGE_KEY, skinInitializationScript } from "./skins.ts";

test("页面绘制前应用已保存的皮肤，只接受已注册预设", () => {
  for (const [saved, expected] of [["blue", "blue"], ["guangyu", "guangyu"], [null, DEFAULT_SKIN], ["unknown", DEFAULT_SKIN]]) {
    const document = { documentElement: { dataset: {} } };
    runInNewContext(skinInitializationScript, {
      document,
      localStorage: {
        getItem(key) {
          assert.equal(key, SKIN_STORAGE_KEY);
          return saved;
        },
      },
    });
    assert.equal(document.documentElement.dataset.skin, expected);
  }
});

test("浏览器禁止读取本地存储时仍能加载默认皮肤", () => {
  const document = { documentElement: { dataset: {} } };
  runInNewContext(skinInitializationScript, {
    document,
    localStorage: { getItem() { throw new Error("Storage unavailable"); } },
  });
  assert.equal(document.documentElement.dataset.skin, DEFAULT_SKIN);
});
