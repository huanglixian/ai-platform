import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("真实静态应用发布保留私有范围，授权冲突时回滚运行版本", async () => {
  const root = process.cwd();
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "publication-access-"),
  );
  const originalOrigin = process.env.AGENT_HUB_BASE_URL;
  let identity, factory, stopPublishedApplication, project;
  try {
    for (const name of ["features", "lib", "app_factory", "node_modules"])
      await fs.symlink(path.join(root, name), path.join(temporary, name));
    process.chdir(temporary);
    process.env.AGENT_HUB_BASE_URL = "http://localhost:19844";
    const { getAgentHubDatabase, closeAgentHubDatabase } = await import(
      "@/lib/agenthub/database"
    );
    const { getAppFactoryDatabase, createProject } = await import(
      "@/app_factory/server/database"
    );
    const { readPrincipal } = await import("@/features/auth/session");
    const { runAsUser } = await import("@/features/auth/context");
    const { updateUser } = await import("@/features/auth/users");
    const { getResourcePolicy } = await import("@/features/access/server");
    const { listApplications, updateApplication } = await import(
      "@/features/apps/server"
    );
    const { enqueuePublication, getPublicationJob } = await import(
      "@/app_factory/server/publication/repository"
    );
    const { runPublicationWorkerOnce } = await import(
      "@/app_factory/server/publication/worker"
    );
    ({ stopPublishedApplication } = await import(
      "@/app_factory/server/publication/runtime"
    ));
    identity = getAgentHubDatabase();
    factory = getAppFactoryDatabase();
    for (const [id, role] of [
      ["admin", "super_admin"],
      ["owner", "internal_user"],
      ["other", "internal_user"],
    ]) {
      identity
        .prepare(
          "INSERT INTO platform_users(id,username,display_name,password_hash,created_at,updated_at) VALUES (?,?,?,'unused','','')",
        )
        .run(id, id, id);
      identity
        .prepare(
          "INSERT INTO platform_user_roles(user_id,role_code) VALUES (?,?)",
        )
        .run(id, role);
    }
    const owner = readPrincipal("owner"),
      other = readPrincipal("other");
    project = runAsUser(owner, () =>
      createProject({ name: "发布权限验收", templateId: "static-html" }),
    );
    const socket = net.createServer();
    await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
    const port = socket.address().port;
    await new Promise((resolve) => socket.close(resolve));
    factory
      .prepare("UPDATE projects SET published_port=? WHERE id=?")
      .run(port, project.id);

    const first = runAsUser(owner, () =>
      enqueuePublication(project.id, "private", 0),
    );
    assert.equal(await runPublicationWorkerOnce(), true);
    const firstResult = getPublicationJob(first.id);
    assert.equal(firstResult.status, "succeeded", firstResult.error);
    const applicationId = firstResult.result.applicationId;
    assert.equal(firstResult.result.entryUrl, `/applications/${applicationId}/open`);
    assert.deepEqual(getResourcePolicy("application", applicationId), {
      ownerId: "owner",
      visibility: "private",
      revision: 1,
    });
    assert.equal(
      runAsUser(other, listApplications).some(
        (app) => app.id === applicationId,
      ),
      false,
    );
    assert.equal((await fetch(`http://127.0.0.1:${port}`)).status, 200);

    const second = runAsUser(owner, () => enqueuePublication(project.id));
    assert.equal(second.visibility, "private");
    await runPublicationWorkerOnce();
    const secondResult = getPublicationJob(second.id);
    assert.equal(secondResult.status, "succeeded", secondResult.error);
    assert.equal(secondResult.result.applicationId, applicationId);
    assert.equal(getResourcePolicy("application", applicationId).revision, 1);

    const third = runAsUser(owner, () =>
      enqueuePublication(project.id, "private", 1),
    );
    runAsUser(owner, () =>
      updateApplication(applicationId, {
        visibility: "all",
        policyRevision: 1,
      }),
    );
    await runPublicationWorkerOnce();
    const thirdResult = getPublicationJob(third.id);
    assert.equal(thirdResult.status, "failed");
    assert.match(thirdResult.error, /访问范围已被修改/);
    assert.equal(
      getResourcePolicy("application", applicationId).visibility,
      "all",
    );
    assert.equal(
      identity
        .prepare("SELECT version FROM applications WHERE id=?")
        .get(applicationId).version,
      "2",
    );
    assert.equal((await fetch(`http://127.0.0.1:${port}`)).status, 200);

    const fourth = runAsUser(owner, () =>
      enqueuePublication(project.id, "internal", 2),
    );
    updateUser(
      "owner",
      { displayName: "owner", roles: ["internal_user"], status: "disabled" },
      "admin",
    );
    await runPublicationWorkerOnce();
    assert.equal(getPublicationJob(fourth.id).status, "failed");
    assert.match(getPublicationJob(fourth.id).error, /已停用/);
    assert.equal(
      getResourcePolicy("application", applicationId).visibility,
      "all",
    );

    await stopPublishedApplication(project.id);
    project = undefined;
    factory.close();
    factory = undefined;
    closeAgentHubDatabase();
    identity = undefined;
  } finally {
    if (project && stopPublishedApplication)
      await stopPublishedApplication(project.id);
    factory?.close();
    identity?.close();
    process.chdir(root);
    if (originalOrigin === undefined) delete process.env.AGENT_HUB_BASE_URL;
    else process.env.AGENT_HUB_BASE_URL = originalOrigin;
    await fs.rm(temporary, { recursive: true, force: true });
  }
});
