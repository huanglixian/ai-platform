import fs from "node:fs/promises";
import path from "node:path";

import { nextjsRuntime } from "@/app_factory/runtimes/nextjs";
import {
  getPreviewWorkspacePath,
  getRuntimeWorkspaceRevision,
} from "@/app_factory/server/runtime-workspace";

type PreviewBuild = {
  revision: string;
  stage: string;
  output: string;
  promise: Promise<PreviewArtifact>;
};

export type PreviewArtifact = {
  revision: string;
  releasePath: string;
};

const globalForPreviewBuild = globalThis as typeof globalThis & {
  appFactoryPreviewBuilds?: Map<string, PreviewBuild>;
};
const builds = (globalForPreviewBuild.appFactoryPreviewBuilds ??= new Map<string, PreviewBuild>());

function buildsPath(projectId: string) {
  return `${getPreviewWorkspacePath(projectId)}.builds`;
}

function artifactPath(projectId: string, revision: string) {
  return path.join(buildsPath(projectId), revision);
}

async function artifactExists(releasePath: string) {
  const marker = await fs.readFile(path.join(releasePath, ".appfactory-preview-ready"), "utf8")
    .catch(() => null);
  if (marker !== path.basename(releasePath)) return false;
  return fs.access(path.join(releasePath, "server.js")).then(() => true).catch(() => false);
}

export function getEnterprisePreviewBuildStage(projectId: string) {
  return builds.get(projectId)?.stage ?? null;
}

export async function prepareEnterprisePreview(projectId: string, workspacePath: string): Promise<PreviewArtifact> {
  const revision = await getRuntimeWorkspaceRevision(workspacePath);
  const releasePath = artifactPath(projectId, revision);
  const active = builds.get(projectId);
  if (active) {
    if (active.revision === revision) return active.promise;
    await active.promise.catch(() => undefined);
    return prepareEnterprisePreview(projectId, workspacePath);
  }
  if (await artifactExists(releasePath)) return { revision, releasePath };

  const build: PreviewBuild = {
    revision,
    stage: "正在校验并构建预览",
    output: "",
    promise: Promise.resolve({ revision, releasePath }),
  };
  build.promise = (async () => {
    try {
      await fs.rm(releasePath, { recursive: true, force: true });
      await nextjsRuntime.buildRelease(workspacePath, releasePath, {
        enterprise: { workerEntry: null },
        onLog: ({ stage, output }) => {
          build.stage = stage === "package" ? "正在打包预览" : `已完成 ${stage}，继续构建预览`;
          build.output = output.slice(-2_000);
        },
      });
      if (await getRuntimeWorkspaceRevision(workspacePath) !== revision) {
        throw new Error("构建期间应用源码发生变化，请重新构建预览");
      }
      await fs.writeFile(path.join(releasePath, ".appfactory-preview-ready"), revision);
      return { revision, releasePath };
    } catch (error) {
      await fs.rm(releasePath, { recursive: true, force: true });
      const message = error instanceof Error ? error.message : "预览构建失败";
      throw new Error(`${message}${build.output ? `\n${build.output}` : ""}`);
    } finally {
      if (builds.get(projectId) === build) builds.delete(projectId);
    }
  })();
  builds.set(projectId, build);
  return build.promise;
}

export async function pruneEnterprisePreviewBuilds(projectId: string, workspacePath: string, keepRevision: string) {
  if (await getRuntimeWorkspaceRevision(workspacePath) !== keepRevision) return;
  const active = builds.get(projectId);
  if (active && active.revision !== keepRevision) return;
  const root = buildsPath(projectId);
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.isDirectory() && /^[a-f0-9]{64}$/.test(entry.name) && entry.name !== keepRevision) {
      await fs.rm(path.join(root, entry.name), { recursive: true, force: true });
    }
  }
}
