import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire, registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";

test("身份、应用授权与个人项目边界", async (t) => {
  const root = process.cwd();
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "platform-auth-"));
  const require = createRequire(import.meta.url);
  const resolution = registerHooks({
    resolve(specifier, context, next) {
      if (specifier === "next/server")
        return {
          url: pathToFileURL(require.resolve(specifier)).href,
          shortCircuit: true,
        };
      return next(specifier, context);
    },
  });
  let database;
  let factory;
  const previousOrigin = process.env.AGENT_HUB_BASE_URL;
  try {
    for (const name of [
      "features",
      "lib",
      "app_factory",
      "node_modules",
      "app",
    ])
      await fs.symlink(path.join(root, name), path.join(directory, name));
    process.chdir(directory);
    process.env.AGENT_HUB_BASE_URL = "http://localhost";
    const { getAgentHubDatabase, closeAgentHubDatabase } = await import(
      "../../lib/agenthub/database.ts"
    );
    const { readPrincipal, createSession, readSession, sessionCookie } =
      await import("./session.ts");
    const { hashPassword, verifyPassword } = await import("./password.ts");
    const { runAsUser } = await import("@/features/auth/context");
    const { authorizeApiRequest, withApiAuth } = await import("./api.ts");
    const { updateUser, deleteUser, resetPassword, userInputSchema } =
      await import("./users.ts");
    const { isolatedApplicationUrl } = await import("./origin.ts");
    const { getResourcePolicy, canUseResource } = await import(
      "../access/server.ts"
    );
    const {
      createApplication,
      listApplications,
      updateApplication,
      publishedApplicationAccess,
    } = await import("../apps/server.ts");
    const { getAppFactoryDatabase, createProject, listProjects } = await import(
      "../../app_factory/server/database.ts"
    );
    const { enqueuePublication, listPublicationJobs, cancelPublicationJob } =
      await import("../../app_factory/server/publication/repository.ts");
    database = getAgentHubDatabase();
    factory = getAppFactoryDatabase();
    const hash = await hashPassword("test-password-123");
    for (const [id, role] of [
      ["admin", "super_admin"],
      ["manager", "app_admin"],
      ["alice", "internal_user"],
      ["bob", "internal_user"],
      ["guest", "external_user"],
    ]) {
      database
        .prepare(
          "INSERT INTO platform_users(id,username,display_name,password_hash,created_at,updated_at) VALUES (?,?,?,?,?,?)",
        )
        .run(id, id, id, hash, "", "");
      database
        .prepare(
          "INSERT INTO platform_user_roles(user_id,role_code) VALUES (?,?)",
        )
        .run(id, role);
    }
    const admin = readPrincipal("admin"),
      manager = readPrincipal("manager"),
      alice = readPrincipal("alice"),
      bob = readPrincipal("bob"),
      guest = readPrincipal("guest");
    const input = {
      name: "授权测试",
      description: "",
      producer: "dify",
      kind: "application",
      runtime: "web",
      status: "active",
      entryUrl: "https://example.test/app",
      version: "1",
      visibility: "internal",
    };
    const app = runAsUser(admin, () => createApplication(input));
    await t.test("密码使用独立盐，正确与错误口令可区分", async () => {
      assert.equal(await verifyPassword("test-password-123", hash), true);
      assert.equal(await verifyPassword("incorrect", hash), false);
      assert.equal(await verifyPassword("anything", "invalid"), false);
      assert.notEqual(await hashPassword("test-password-123"), hash);
    });
    await t.test("内部范围包含两个管理员角色，外部账号不能访问", () => {
      const policy = getResourcePolicy("application", app.id);
      for (const user of [admin, manager, alice, bob])
        assert.equal(canUseResource(user, policy), true);
      assert.equal(canUseResource(guest, policy), false);
      assert.equal(canUseResource(admin, undefined), false);
      assert.equal(
        runAsUser(guest, listApplications).some((item) => item.id === app.id),
        false,
      );
    });
    await t.test(
      "三种范围按所有权和内部资格判断，全部用户仍须登录",
      async () => {
        runAsUser(admin, () =>
          updateApplication(app.id, {
            visibility: "all",
            policyRevision: app.access.revision,
          }),
        );
        assert.equal(
          canUseResource(guest, getResourcePolicy("application", app.id)),
          true,
        );
        const revision = getResourcePolicy("application", app.id).revision;
        runAsUser(admin, () =>
          updateApplication(app.id, {
            visibility: "private",
            policyRevision: revision,
          }),
        );
        for (const user of [manager, alice, guest])
          assert.equal(
            canUseResource(user, getResourcePolicy("application", app.id)),
            false,
          );
        assert.equal(
          canUseResource(admin, getResourcePolicy("application", app.id)),
          true,
        );
        const { GET } = await import(
          "../../app/api/agenthub/v1/applications/route.ts"
        );
        const unauthorized = await GET(
          new Request("http://localhost/api/agenthub/v1/applications", {
            headers: { "x-agenthub-actor": "system" },
          }),
        );
        assert.equal(unauthorized.status, 401);
      },
    );
    await t.test(
      "服务端阻止管理越权、伪造身份、跨站写入和其他主机名登录",
      async () => {
        const token = createSession("guest");
        const handler = withApiAuth(() => new Response("must not run"));
        const response = await handler(
          new Request("http://localhost/api/platform/users", {
            headers: {
              cookie: `${sessionCookie}=${token}`,
              "x-agenthub-actor": "system",
            },
          }),
        );
        assert.equal(response.status, 403);
        const csrf = await handler(
          new Request("http://localhost/api/platform/auth/logout", {
            method: "POST",
            headers: {
              cookie: `${sessionCookie}=${token}`,
              origin: "https://attacker.test",
            },
          }),
        );
        assert.equal(csrf.status, 403);
        const alternateHost = await handler(
          new Request("http://127.0.0.1/api/platform/auth/me", {
            headers: { cookie: `${sessionCookie}=${token}` },
          }),
        );
        assert.equal(alternateHost.status, 403);
        assert.throws(() =>
          authorizeApiRequest(
            new Request("http://localhost/api/appfactory/v1/projects"),
            guest,
          ),
        );
        assert.throws(() =>
          authorizeApiRequest(
            new Request("http://localhost/api/knowhub/docspace"),
            alice,
          ),
        );
      },
    );
    await t.test("普通目录响应不包含启动命令和宿主访问地址", () => {
      const external = runAsUser(admin, () =>
        createApplication({
          ...input,
          producer: "external",
          name: "运行命令",
          launchCommand: "cd /private/secret && true",
        }),
      );
      const member = runAsUser(alice, listApplications).find(
        (item) => item.id === external.id,
      );
      assert.equal(member.launchCommand, null);
      assert.equal(member.canManage, false);
      assert.equal(member.canOperate, false);
      assert.equal(member.access, undefined);
      assert.equal(member.url, `/applications/${external.id}/open`);
    });
    let project;
    await t.test("用户只能列出和访问自己的项目、会话、任务与日志", () => {
      project = runAsUser(alice, () =>
        createProject({ name: "个人项目", templateId: "static-html" }),
      );
      assert.equal(runAsUser(alice, listProjects).length, 1);
      assert.equal(runAsUser(bob, listProjects).length, 0);
      assert.equal(runAsUser(admin, listProjects).length, 0);
      const job = runAsUser(alice, () =>
        enqueuePublication(project.id, "private"),
      );
      for (const suffix of [
        "",
        "/files",
        "/preview",
        "/sessions",
        "/publication",
      ])
        assert.throws(() =>
          authorizeApiRequest(
            new Request(
              `http://localhost/api/appfactory/v1/projects/${project.id}${suffix}`,
            ),
            bob,
          ),
        );
      for (const suffix of ["", "/events", "/stream", "/actions"])
        assert.throws(() =>
          authorizeApiRequest(
            new Request(
              `http://localhost/api/appfactory/v1/publication-jobs/${job.id}${suffix}`,
            ),
            bob,
          ),
        );
      assert.equal(
        runAsUser(bob, () => listPublicationJobs(project.id)).length,
        0,
      );
      assert.equal(runAsUser(alice, listPublicationJobs).length, 1);
      cancelPublicationJob(job.id);
    });
    await t.test(
      "发布私有应用后更新版本保留归属，陈旧任务不能覆盖新范围",
      () => {
        const published = createApplication(
          {
            ...input,
            producer: "appfactory",
            externalId: project.id,
            visibility: "private",
          },
          { ownerId: alice.id, actorId: alice.id, expectedRevision: 0 },
        );
        assert.equal(
          canUseResource(bob, getResourcePolicy("application", published.id)),
          false,
        );
        const updated = createApplication(
          {
            ...input,
            producer: "appfactory",
            externalId: project.id,
            visibility: "private",
            version: "2",
          },
          { ownerId: alice.id, actorId: alice.id, expectedRevision: 1 },
        );
        assert.equal(updated.id, published.id);
        assert.equal(
          getResourcePolicy("application", published.id).ownerId,
          alice.id,
        );
        runAsUser(alice, () =>
          updateApplication(published.id, {
            visibility: "all",
            policyRevision: 1,
          }),
        );
        assert.throws(
          () =>
            createApplication(
              {
                ...input,
                producer: "appfactory",
                externalId: project.id,
                visibility: "internal",
                entryUrl: "https://example.test/wrong",
              },
              { ownerId: alice.id, actorId: alice.id, expectedRevision: 1 },
            ),
          /访问范围已被修改/,
        );
        assert.equal(publishedApplicationAccess(project.id).visibility, "all");
        assert.equal(
          database
            .prepare("SELECT entry_url FROM applications WHERE id=?")
            .get(published.id).entry_url,
          input.entryUrl,
        );
        const job = runAsUser(alice, () => enqueuePublication(project.id));
        assert.equal(job.visibility, "all");
        cancelPublicationJob(job.id);
      },
    );
    await t.test(
      "账号默认内部角色，外部角色组合无效，最后一个管理员受保护",
      () => {
        assert.deepEqual(
          userInputSchema.parse({
            username: "NewUser",
            displayName: "新用户",
            password: "valid-password",
          }).roles,
          ["internal_user"],
        );
        assert.equal(
          userInputSchema.safeParse({
            username: "newuser",
            displayName: "新用户",
            password: "valid-password",
            roles: ["external_user", "internal_user"],
          }).success,
          false,
        );
        assert.throws(
          () =>
            updateUser(
              admin.id,
              {
                displayName: "管理员",
                status: "disabled",
                roles: ["super_admin"],
              },
              admin.id,
            ),
          /至少一个/,
        );
        assert.throws(() => deleteUser(alice.id, admin.id), /拥有应用或项目/);
      },
    );
    await t.test("发布重试保留私有意图，过期的范围配置不能创建任务", () => {
      const current = publishedApplicationAccess(project.id);
      assert.throws(
        () =>
          runAsUser(alice, () =>
            enqueuePublication(project.id, "internal", current.revision - 1),
          ),
        /访问范围已变化/,
      );
      const first = runAsUser(alice, () =>
        enqueuePublication(project.id, "private", current.revision),
      );
      cancelPublicationJob(first.id);
      const retry = runAsUser(alice, () =>
        enqueuePublication(project.id, first.visibility, first.policyRevision),
      );
      assert.equal(retry.visibility, "private");
      cancelPublicationJob(retry.id);
    });
    await t.test("长连接在会话被撤销后关闭，不继续发送日志", async (st) => {
      st.mock.timers.enable({ apis: ["setInterval"] });
      const token = createSession(alice.id);
      const job = runAsUser(alice, () => listPublicationJobs(project.id))[0];
      let cancelled = false;
      const handler = withApiAuth(
        () =>
          new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode("data: hello\n\n"));
              },
              cancel() {
                cancelled = true;
              },
            }),
            { headers: { "content-type": "text/event-stream" } },
          ),
      );
      const response = await handler(
        new Request(
          `http://localhost/api/appfactory/v1/publication-jobs/${job.id}/events`,
          { headers: { cookie: `${sessionCookie}=${token}` } },
        ),
      );
      const reader = response.body.getReader();
      assert.equal((await reader.read()).done, false);
      database
        .prepare("DELETE FROM platform_sessions WHERE user_id=?")
        .run(alice.id);
      st.mock.timers.tick(15_000);
      assert.equal((await reader.read()).done, true);
      assert.equal(cancelled, true);
    });
    await t.test("角色变更、停用、密码重置和删除均使旧会话失效", async () => {
      let token = createSession(bob.id);
      assert.equal(readSession(token).id, bob.id);
      updateUser(
        bob.id,
        { displayName: "Bob", status: "active", roles: ["app_admin"] },
        admin.id,
      );
      assert.equal(readSession(token), null);
      token = createSession(bob.id);
      updateUser(
        bob.id,
        { displayName: "Bob", status: "disabled", roles: ["app_admin"] },
        admin.id,
      );
      assert.equal(readSession(token), null);
      updateUser(
        bob.id,
        { displayName: "Bob", status: "active", roles: ["internal_user"] },
        admin.id,
      );
      token = createSession(bob.id);
      await resetPassword(bob.id, "another-password", admin.id);
      assert.equal(readSession(token), null);
      token = createSession(bob.id);
      deleteUser(bob.id, admin.id);
      assert.equal(readSession(token), null);
      const expired = createSession(guest.id);
      database.prepare("UPDATE platform_sessions SET expires_at=0").run();
      assert.equal(readSession(expired), null);
    });
    await t.test("应用与预览地址使用独立主机名，Cookie 不会因端口共享", () => {
      assert.equal(
        isolatedApplicationUrl("http://localhost:4100/path"),
        "http://127.0.0.1:4100/path",
      );
      assert.equal(
        isolatedApplicationUrl("https://example.test/path"),
        "https://example.test/path",
      );
      assert.throws(() => isolatedApplicationUrl("javascript:alert(1)"));
    });
    factory.close();
    factory = undefined;
    closeAgentHubDatabase();
    database = undefined;
  } finally {
    resolution.deregister();
    factory?.close();
    database?.close();
    process.chdir(root);
    if (previousOrigin === undefined) delete process.env.AGENT_HUB_BASE_URL;
    else process.env.AGENT_HUB_BASE_URL = previousOrigin;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
