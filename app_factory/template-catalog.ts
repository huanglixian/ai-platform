import fs from "node:fs";
import path from "node:path";

import type { RuntimeId } from "@/app_factory/runtimes/types";

export type AppTemplateId = "nextjs-app" | "static-html";

export type AppTemplate = {
  id: AppTemplateId;
  name: string;
  description: string;
  runtimeId: RuntimeId;
  rootPath: string;
};

export type AppTemplateSummary = Pick<AppTemplate, "id" | "name" | "description">;

const templatesRoot = path.join(process.cwd(), "app_factory", "templates");

const templates: Record<AppTemplateId, Omit<AppTemplate, "rootPath">> = {
  "nextjs-app": {
    id: "nextjs-app",
    name: "Next.js 应用",
    description: "适合需要服务端渲染、路由与全栈能力的 Web 应用。",
    runtimeId: "nextjs",
  },
  "static-html": {
    id: "static-html",
    name: "纯 HTML 应用",
    description: "适合无需构建工具的单页展示、原型和轻量交互页面。",
    runtimeId: "static-web",
  },
};

function templatePath(id: AppTemplateId) {
  return path.join(templatesRoot, id);
}

export function listAppTemplates(): AppTemplate[] {
  return Object.values(templates).map((template) => ({
    ...template,
    rootPath: templatePath(template.id),
  }));
}

export function listAppTemplateSummaries(): AppTemplateSummary[] {
  return listAppTemplates().map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
}

export function isAppTemplateId(value: string): value is AppTemplateId {
  return value in templates;
}

export function getAppTemplate(id: string): AppTemplate {
  if (!isAppTemplateId(id)) throw new Error(`未注册的项目模板：${id}`);
  return { ...templates[id], rootPath: templatePath(id) };
}

function replaceTemplateTokens(root: string, name: string) {
  const values = {
    "{{APP_NAME_JSON}}": JSON.stringify(name),
    "{{APP_NAME_JS}}": JSON.stringify(name).slice(1, -1),
    "{{APP_NAME_HTML}}": name
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;"),
  };
  const visit = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) {
        let content = fs.readFileSync(target, "utf8");
        for (const [token, value] of Object.entries(values)) {
          content = content.replaceAll(token, value);
        }
        fs.writeFileSync(target, content);
      }
    }
  };
  visit(root);
}

function listWorkspaceFiles(root: string, current = root): string[] {
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) return listWorkspaceFiles(root, target);
    return entry.isFile() ? [path.relative(root, target)] : [];
  });
}

export function createTemplateWorkspace(
  template: AppTemplate,
  workspacePath: string,
  name: string,
) {
  const scaffoldPath = path.join(template.rootPath, "scaffold");
  fs.mkdirSync(path.dirname(workspacePath), { recursive: true });
  fs.cpSync(scaffoldPath, workspacePath, { recursive: true });
  replaceTemplateTokens(workspacePath, name);
  const baseline = Object.fromEntries(
    listWorkspaceFiles(workspacePath).map((relative) => [
      relative,
      fs.readFileSync(path.join(workspacePath, relative), "utf8"),
    ]),
  );
  fs.writeFileSync(
    path.join(workspacePath, ".appfactory-baseline.json"),
    JSON.stringify(baseline, null, 2),
  );
}
