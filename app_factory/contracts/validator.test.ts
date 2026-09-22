import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { createTemplateWorkspace, getAppTemplate } from "../template-catalog.ts";
// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { assertNextjsEnterpriseRuntimeEnvironmentConfigured, enterpriseSchemaForProject, getNextjsEnterpriseFrameworkBinding } from "../nextjs-enterprise-framework.ts";
// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { readApplicationManifest, validateProject } from "./validator.ts";

async function createWorkspace(healthPath: string) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-manifest-"));
  await fs.mkdir(path.join(workspace, "app"), { recursive: true });
  await fs.writeFile(path.join(workspace, "app", "page.tsx"), "export default function Page() { return null; }");
  await fs.writeFile(
    path.join(workspace, "app.yaml"),
    `name: test\nversion: 1.0.0\nruntime: nextjs\nentry: app/page.tsx\nhealthPath: ${healthPath}\ncapabilities: []\n`,
  );
  return workspace;
}

test("读取并校验发布健康路径", async () => {
  const workspace = await createWorkspace("/ready");
  try {
    assert.equal((await readApplicationManifest(workspace)).healthPath, "/ready");
    assert.equal((await validateProject(workspace)).some((check) => check.level === "error"), false);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test("Next.js 企业模板保护核心并允许业务扩展", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-nextjs-enterprise-manifest-"));
  const workspace = path.join(root, "workspace");
  try {
    createTemplateWorkspace(
      getAppTemplate("nextjs-enterprise"),
      workspace,
      "通用企业应用",
      "project-12345678-1234-1234-1234-1234567890ab",
    );
    assert.equal(
      (await validateProject(workspace)).some((check) => check.level === "error"),
      false,
    );

    await fs.writeFile(
      path.join(workspace, "db", "migrations", "0002_unmanaged.sql"),
      "CREATE TABLE unmanaged_framework_data (id text PRIMARY KEY);\n",
    );
    assert.equal(
      (await validateProject(workspace)).some(
        (check) => check.level === "error"
          && check.message.includes("Framework 迁移编号区间包含未受管文件"),
      ),
      true,
    );
    await fs.rm(path.join(workspace, "db", "migrations", "0002_unmanaged.sql"));

    await fs.writeFile(
      path.join(workspace, "src", "server", "shared", "customer-summary.ts"),
      "export const customerSummary = () => null;\n",
    );
    await fs.writeFile(
      path.join(workspace, "db", "migrations", "1000_customer_summary.sql"),
      "CREATE TABLE customer_summary (id text PRIMARY KEY);\n",
    );
    assert.equal(
      (await validateProject(workspace)).some((check) => check.level === "error"),
      false,
    );

    await fs.appendFile(
      path.join(workspace, "src", "server", "permissions", "service.ts"),
      "\nexport const bypassPermissions = true;\n",
    );
    assert.equal(
      (await validateProject(workspace)).some(
        (check) => check.level === "error"
          && check.message.includes("企业 Framework 受管文件被修改：src/server/permissions/service.ts"),
      ),
      true,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("企业发布不能篡改项目分配的数据库 Schema", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-enterprise-schema-"));
  const workspace = path.join(root, "workspace");
  const projectId = "project-12345678-1234-1234-1234-1234567890ab";
  const schema = enterpriseSchemaForProject(projectId);
  const enterpriseBinding = {
    ...getNextjsEnterpriseFrameworkBinding(),
    databaseSchema: schema,
  };
  try {
    createTemplateWorkspace(getAppTemplate("nextjs-enterprise"), workspace, "通用企业应用", projectId);
    assert.equal(
      (await validateProject(workspace, { enterpriseBinding }))
        .some((check) => check.level === "error"),
      false,
    );
    const manifest = path.join(workspace, "app.yaml");
    await fs.writeFile(
      manifest,
      (await fs.readFile(manifest, "utf8")).replace(schema, "appfactory_shared"),
    );
    assert.equal(
      (await validateProject(workspace, { enterpriseBinding })).some(
        (check) => check.level === "error"
          && check.message === "databaseSchema 必须保持为项目分配的隔离 Schema",
      ),
      true,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("仍会拒绝业务源码中的硬编码密钥", async () => {
  const workspace = await createWorkspace("/ready");
  try {
    await fs.writeFile(
      path.join(workspace, "app", "page.tsx"),
      'const apiKey = "abcdefghijklmnop"; export default function Page() { return null; }',
    );
    assert.equal(
      (await validateProject(workspace)).some(
        (check) => check.level === "error" && check.message.includes("疑似硬编码密钥"),
      ),
      true,
    );
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test("企业发布要求由宿主运行环境提供应用密钥", () => {
  assert.throws(
    () => assertNextjsEnterpriseRuntimeEnvironmentConfigured({}),
    /DATABASE_URL、APP_AUTH_SECRET、ENTERPRISE_BOOTSTRAP_TOKEN/,
  );
  assert.doesNotThrow(() => assertNextjsEnterpriseRuntimeEnvironmentConfigured({
    DATABASE_URL: "postgresql://example.invalid/app",
    APP_AUTH_SECRET: "a".repeat(32),
    ENTERPRISE_BOOTSTRAP_TOKEN: "b".repeat(16),
  }));
  assert.throws(
    () => assertNextjsEnterpriseRuntimeEnvironmentConfigured({
      DATABASE_URL: "postgresql://example.invalid/app",
      APP_AUTH_SECRET: "short",
      ENTERPRISE_BOOTSTRAP_TOKEN: "b".repeat(16),
    }),
    /APP_AUTH_SECRET 至少需要 32 个字符/,
  );
  assert.throws(
    () => assertNextjsEnterpriseRuntimeEnvironmentConfigured({
      DATABASE_URL: "postgresql://example.invalid/app",
      APP_AUTH_SECRET: "a".repeat(32),
      ENTERPRISE_BOOTSTRAP_TOKEN: "short",
    }),
    /ENTERPRISE_BOOTSTRAP_TOKEN 至少需要 16 个字符/,
  );
});

test("企业模板不能通过删除企业清单降级为普通发布", async () => {
  const workspace = await createWorkspace("/ready");
  try {
    assert.equal(
      (await validateProject(workspace, { requiresEnterprise: true })).some(
        (check) => check.level === "error"
          && check.message === "企业模板不能移除 app.yaml 的企业配置",
      ),
      true,
    );
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test("拒绝非站内健康路径", async () => {
  const workspace = await createWorkspace("//outside.example");
  try {
    assert.deepEqual(
      (await validateProject(workspace)).filter((check) => check.level === "error"),
      [{ level: "error", message: "healthPath 必须是以 / 开头的站内路径" }],
    );
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
