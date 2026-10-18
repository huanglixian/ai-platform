import assert from "node:assert/strict";
import test from "node:test";
import { createNotifier } from "./notify.ts";

function setup() {
  const toasts = new Map();
  let additions = 0;
  const notifier = createNotifier({
    add(options) {
      const id = String(++additions);
      toasts.set(id, options);
      return id;
    },
    update(id, options) { toasts.set(id, { ...toasts.get(id), ...options }); },
    close(id) { const toast = toasts.get(id); toasts.delete(id); toast?.onClose(); },
  });
  return { notifier, toasts, additions: () => additions };
}

test("重复消息更新已有通知，关闭后允许再次显示", () => {
  const { notifier, toasts, additions } = setup();
  const key = notifier.error("网络连接失败");
  notifier.error("网络连接失败");
  assert.equal(additions(), 1);
  assert.equal(toasts.size, 1);
  notifier.dismiss(key);
  assert.equal(toasts.size, 0);
  notifier.error("网络连接失败");
  assert.equal(additions(), 2);
});

test("同一操作从加载更新到结果，不新增 Toast 或保留旧内容", () => {
  const { notifier, toasts, additions } = setup();
  notifier.loading("正在停止应用", { id: "stop-apps", description: "等待进程退出", details: "旧详情" });
  assert.equal(toasts.get("1").timeout, 0);
  notifier.success("已停止 2 个外部应用", { id: "stop-apps" });
  assert.equal(additions(), 1);
  const result = toasts.get("1");
  assert.equal(result.title, "已停止 2 个外部应用");
  assert.equal(result.type, "success");
  assert.equal(result.timeout, 3000);
  assert.equal(result.description, undefined);
  assert.equal(result.data.details, undefined);
});

test("有详情的失败保留到手动关闭，独立操作可分别反馈", () => {
  const { notifier, toasts } = setup();
  notifier.warning("部分应用停止失败", { details: "应用 A：权限不足" });
  assert.equal(toasts.get("1").timeout, 0);
  notifier.success("已保存", { id: "save-a" });
  notifier.success("已保存", { id: "save-b", duration: 1000 });
  assert.equal(toasts.size, 3);
  assert.equal(toasts.get("3").timeout, 1000);
});
