import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { isProcessGroupRunning, startExternalProcess, stopExternalProcess } from "./external-launcher.ts";

async function launchService() {
  const socket = net.createServer();
  await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  const url = `http://127.0.0.1:${port}`;
  const script = `require('node:http').createServer((_, response) => response.end('ok')).listen(${port}, '127.0.0.1')`;
  return startExternalProcess({ command: `${JSON.stringify(process.execPath)} -e ${JSON.stringify(script)}`, url, timeoutMs: 5_000 });
}

test("批量停止外部应用", async (t) => {
  const root = process.cwd();
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "external-stop-"));
  let database;
  const processes = [];
  try {
    for (const directory of ["features", "app_factory", "lib", "node_modules"]) {
      await fs.symlink(path.join(root, directory), path.join(temporaryDirectory, directory));
    }
    process.chdir(temporaryDirectory);
    const { getAgentHubDatabase, closeAgentHubDatabase } = await import("../../lib/agenthub/database.ts");
    const { stopManagedExternalApplications } = await import("./server.ts");
    database = getAgentHubDatabase();
    const insert = database.prepare(`INSERT INTO applications
      (id, name, producer, kind, runtime, status, created_at, updated_at, launch_pid, launch_status)
      VALUES (?, ?, ?, 'application', 'web', 'active', '', '', ?, ?)`);

    await t.test("停止运行中和启动中的托管应用，保留其他来源及未托管进程", async () => {
      const running = await launchService();
      processes.push(running.pid);
      const starting = await launchService();
      processes.push(starting.pid);
      const other = await launchService();
      processes.push(other.pid);
      insert.run("running", "运行应用", "external", running.pid, "running");
      insert.run("starting", "启动应用", "external", starting.pid, "starting");
      insert.run("other", "其他来源", "appfactory", other.pid, "running");
      insert.run("unmanaged", "未托管应用", "external", null, null);

      const result = await stopManagedExternalApplications();
      assert.deepEqual(result.stoppedIds.sort(), ["running", "starting"]);
      assert.deepEqual(result.failures, []);
      assert.equal(isProcessGroupRunning(running.pid), false);
      assert.equal(isProcessGroupRunning(starting.pid), false);
      assert.equal(isProcessGroupRunning(other.pid), true);
      assert.deepEqual(database.prepare("SELECT launch_pid, launch_status FROM applications WHERE id='running'").get(), { launch_pid: null, launch_status: null });
      assert.equal(database.prepare("SELECT launch_pid FROM applications WHERE id='other'").get().launch_pid, other.pid);
      database.prepare("DELETE FROM applications").run();
    });

    await t.test("单项失败仍继续处理其他应用，保留失败记录并返回原因", async () => {
      insert.run("failed", "失败应用", "external", 1073741824, "running");
      insert.run("stale", "遗留应用", "external", 1073741825, "starting");
      database.exec("CREATE TRIGGER reject_failed_update BEFORE UPDATE ON applications WHEN OLD.id='failed' BEGIN SELECT RAISE(FAIL, '测试写入失败'); END");
      const result = await stopManagedExternalApplications();
      assert.deepEqual(result.stoppedIds, ["stale"]);
      assert.deepEqual(result.failures, [{ id: "failed", name: "失败应用", message: "测试写入失败" }]);
      assert.equal(database.prepare("SELECT launch_pid FROM applications WHERE id='failed'").get().launch_pid, 1073741824);
      assert.equal(database.prepare("SELECT launch_pid FROM applications WHERE id='stale'").get().launch_pid, null);
      database.exec("DROP TRIGGER reject_failed_update");
      database.prepare("DELETE FROM applications").run();
    });

    await t.test("没有托管进程时可重复调用", async () => {
      assert.deepEqual(await stopManagedExternalApplications(), { stoppedIds: [], failures: [] });
      assert.deepEqual(await stopManagedExternalApplications(), { stoppedIds: [], failures: [] });
    });
    closeAgentHubDatabase();
    database = undefined;
  } finally {
    await Promise.all(processes.map((pid) => stopExternalProcess(pid)));
    database?.close();
    process.chdir(root);
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
