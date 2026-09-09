import path from "node:path";

import { readApplicationManifest, validateProject } from "@/app_factory/contracts/validator";
import { createAgentHubClient } from "@/app_factory/features/agenthub-client";
import { getProject, listCapabilityBindings } from "@/app_factory/server/database";
import { buildStandaloneRelease } from "./release-builder";
import {
  allocatePublishedPort,
  restorePublicationRuntimes,
  startPublicationRuntime,
  stopPublicationRuntime,
} from "./runtime";
import {
  completePublicationJob,
  createPublicationDeployment,
  createPublicationRelease,
  failPublicationJob,
  getPublishedPort,
  getPublicationRelease,
  getRunningPublicationDeployment,
  heartbeatPublicationJob,
  isPublicationJobActive,
  requeuePublicationJob,
  setPublishedPort,
  updatePublicationDeployment,
  updatePublicationProgress,
  type PublicationJobLease,
  claimPublicationJob,
} from "./repository";
import type { PublicationDeployment, PublicationRelease } from "./types";

const HEARTBEAT_INTERVAL_MS = 5_000;

function cancellationError() {
  return new Error("发布任务已取消或 Worker 租约失效");
}

function ensureActive(job: PublicationJobLease) {
  if (!isPublicationJobActive(job)) throw cancellationError();
}

async function restorePreviousRuntime(
  deployment: PublicationDeployment | null,
  release: PublicationRelease | null,
) {
  if (!deployment || !release) return;
  const runtime = await startPublicationRuntime(
    deployment.projectId,
    release.artifactPath,
    deployment.port,
    deployment.healthPath,
  );
  updatePublicationDeployment(deployment.id, "running", runtime.pid);
}

async function publish(job: PublicationJobLease, signal: AbortSignal) {
  const project = getProject(job.project_id);
  if (!project) throw new Error("项目不存在");

  updatePublicationProgress(job, "validating", "正在校验应用配置与能力绑定", 1);
  const checks = await validateProject(project.workspacePath, {
    boundCapabilityIds: listCapabilityBindings(project.id).map((binding) => binding.capabilityId),
  });
  const validationErrors = checks.filter((check) => check.level === "error");
  if (validationErrors.length) {
    throw new Error(validationErrors.map((check) => check.message).join("；"));
  }
  const manifest = await readApplicationManifest(project.workspacePath);
  ensureActive(job);

  updatePublicationProgress(job, "building", "正在执行 lint、typecheck 与 Next.js 构建", 2);
  const releasePath = path.join(
    process.cwd(),
    "storage",
    "appfactory",
    "releases",
    project.id,
    job.id,
  );
  await buildStandaloneRelease(project.workspacePath, releasePath, {
    signal,
    onLog(log) {
      updatePublicationProgress(
        job,
        log.stage === "package" ? "packaging" : "building",
        log.output || `${log.stage} 已完成`,
        log.stage === "package" ? 4 : 2,
      );
    },
  });
  ensureActive(job);

  updatePublicationProgress(job, "packaging", "正在创建不可变 Release", 4);
  const release = createPublicationRelease(project.id, job.id, releasePath);
  const previousDeployment = getRunningPublicationDeployment(project.id);
  const previousRelease = previousDeployment
    ? getPublicationRelease(previousDeployment.releaseId)
    : null;
  const port = getPublishedPort(project.id) ?? await allocatePublishedPort();
  if (!getPublishedPort(project.id)) setPublishedPort(project.id, port);

  let newDeployment: PublicationDeployment | null = null;
  let previousStopped = false;
  try {
    updatePublicationProgress(job, "deploying", "正在切换到新 Release", 5);
    if (previousDeployment) {
      if (!await stopPublicationRuntime(project.id, previousDeployment.pid)) {
        throw new Error("旧 Release 未能在 5 秒内停止，已取消切换");
      }
      updatePublicationDeployment(previousDeployment.id, "stopped", null);
      previousStopped = true;
    }
    ensureActive(job);

    const runtime = await startPublicationRuntime(
      project.id,
      release.artifactPath,
      port,
      manifest.healthPath,
    );
    newDeployment = createPublicationDeployment(
      project.id,
      release.id,
      port,
      runtime.url,
      manifest.healthPath,
      runtime.pid,
      "running",
    );
    updatePublicationProgress(job, "checking", "新 Release 健康检查通过", 6);
    ensureActive(job);

    updatePublicationProgress(job, "registering", "正在注册到应用中心", 6);
    const application = await createAgentHubClient().registerApplication({
      name: project.name,
      description: project.description,
      producer: "appfactory",
      kind: "application",
      runtime: "nextjs",
      status: "active",
      entryUrl: runtime.url,
      version: String(release.version),
      externalId: project.id,
    }) as { id?: string };
    if (!application.id) throw new Error("AgentHub 返回的应用缺少 id");
    ensureActive(job);
    const baseUrl = process.env.AGENT_HUB_BASE_URL?.trim().replace(/\/$/, "");
    if (!baseUrl) throw new Error("缺少 AGENT_HUB_BASE_URL");
    completePublicationJob(job, {
      applicationId: application.id,
      releaseId: release.id,
      entryUrl: runtime.url,
      applicationCenterUrl: `${baseUrl}/apps`,
    });
  } catch (error) {
    if (newDeployment) {
      const stopped = await stopPublicationRuntime(project.id, newDeployment.pid);
      if (!stopped) {
        throw new Error("新 Release 未能在 5 秒内停止，无法安全恢复旧 Release");
      }
      updatePublicationDeployment(newDeployment.id, "failed", null);
    }
    if (previousStopped) await restorePreviousRuntime(previousDeployment, previousRelease);
    throw error;
  }
}

export async function runPublicationWorkerOnce(options: { signal?: AbortSignal } = {}) {
  const job = claimPublicationJob();
  if (!job) return false;
  const controller = new AbortController();
  const stop = () => controller.abort(options.signal?.reason ?? new Error("Worker 正在停止"));
  options.signal?.addEventListener("abort", stop, { once: true });
  const heartbeat = setInterval(() => {
    if (!heartbeatPublicationJob(job)) controller.abort(cancellationError());
  }, HEARTBEAT_INTERVAL_MS);
  try {
    await publish(job, controller.signal);
  } catch (error) {
    if (options.signal?.aborted) requeuePublicationJob(job, "Worker 正在停止，等待恢复发布");
    else if (isPublicationJobActive(job)) failPublicationJob(job, error);
  } finally {
    clearInterval(heartbeat);
    options.signal?.removeEventListener("abort", stop);
  }
  return true;
}

export async function restorePublishedApplications() {
  return restorePublicationRuntimes();
}
