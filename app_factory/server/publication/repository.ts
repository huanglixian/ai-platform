import { randomUUID } from "node:crypto";

import { getAppFactoryDatabase } from "@/app_factory/server/database";

import type {
  PublicationDeployment,
  PublicationEvent,
  PublicationEventLevel,
  PublicationJob,
  PublicationRelease,
  PublicationResult,
  PublicationStage,
  PublicationStatus,
} from "./types";

type JobRow = {
  id: string;
  project_id: string;
  status: PublicationStatus;
  stage: PublicationStage;
  step: string;
  completed: number;
  total: number;
  error: string | null;
  attempts: number;
  lease_token: string | null;
  lease_expires_at: number | null;
  release_id: string | null;
  result_json: string | null;
  created_at: string;
  updated_at: string;
};

type ReleaseRow = {
  id: string;
  project_id: string;
  job_id: string;
  version: number;
  artifact_path: string;
  created_at: string;
};

type DeploymentRow = {
  id: string;
  project_id: string;
  release_id: string;
  status: PublicationDeployment["status"];
  port: number;
  url: string;
  pid: number | null;
  created_at: string;
  updated_at: string;
};

function jobDto(row: JobRow): PublicationJob {
  return {
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    stage: row.stage,
    step: row.step,
    completed: row.completed,
    total: row.total,
    error: row.error,
    attempts: row.attempts,
    releaseId: row.release_id,
    result: row.result_json ? JSON.parse(row.result_json) as PublicationResult : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function releaseDto(row: ReleaseRow): PublicationRelease {
  return {
    id: row.id,
    projectId: row.project_id,
    jobId: row.job_id,
    version: row.version,
    artifactPath: row.artifact_path,
    createdAt: row.created_at,
  };
}

function deploymentDto(row: DeploymentRow): PublicationDeployment {
  return {
    id: row.id,
    projectId: row.project_id,
    releaseId: row.release_id,
    status: row.status,
    port: row.port,
    url: row.url,
    pid: row.pid,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function enqueuePublication(projectId: string): PublicationJob {
  const database = getAppFactoryDatabase();
  return database.transaction(() => {
    const existing = database.prepare(
      "SELECT * FROM publication_jobs WHERE project_id=? AND status IN ('queued','running') ORDER BY created_at DESC LIMIT 1",
    ).get(projectId) as JobRow | undefined;
    if (existing) return jobDto(existing);
    const id = `publication-${randomUUID()}`;
    const now = new Date().toISOString();
    database.prepare(
      "INSERT INTO publication_jobs(id,project_id,status,stage,step,completed,total,created_at,updated_at) VALUES (?,?,'queued','queued','等待 Worker 处理',0,7,?,?)",
    ).run(id, projectId, now, now);
    appendPublicationEvent(id, "queued", "info", "发布任务已创建");
    return getPublicationJob(id)!;
  })();
}

export function getPublicationJob(id: string): PublicationJob | null {
  const row = getAppFactoryDatabase().prepare("SELECT * FROM publication_jobs WHERE id=?").get(id) as JobRow | undefined;
  return row ? jobDto(row) : null;
}

export function listPublicationJobs(projectId?: string): PublicationJob[] {
  const database = getAppFactoryDatabase();
  const rows = projectId
    ? database.prepare("SELECT * FROM publication_jobs WHERE project_id=? ORDER BY created_at DESC LIMIT 30").all(projectId)
    : database.prepare("SELECT * FROM publication_jobs ORDER BY created_at DESC LIMIT 30").all();
  return (rows as JobRow[]).map(jobDto);
}

export function appendPublicationEvent(
  jobId: string,
  stage: PublicationStage,
  level: PublicationEventLevel,
  message: string,
): PublicationEvent {
  const database = getAppFactoryDatabase();
  return database.transaction(() => {
    const sequence = (database.prepare("SELECT COALESCE(MAX(sequence), 0) AS value FROM publication_events WHERE job_id=?").get(jobId) as { value: number }).value + 1;
    const id = `publication-event-${randomUUID()}`;
    const createdAt = new Date().toISOString();
    database.prepare(
      "INSERT INTO publication_events(id,job_id,sequence,stage,level,message,created_at) VALUES (?,?,?,?,?,?,?)",
    ).run(id, jobId, sequence, stage, level, message, createdAt);
    return { id, sequence, stage, level, message, createdAt };
  }).immediate();
}

export function listPublicationEvents(jobId: string, after = 0): PublicationEvent[] {
  return getAppFactoryDatabase().prepare(
    "SELECT id,sequence,stage,level,message,created_at as createdAt FROM publication_events WHERE job_id=? AND sequence>? ORDER BY sequence",
  ).all(jobId, after) as PublicationEvent[];
}

export function claimPublicationJob(now = Date.now()): JobRow | null {
  const database = getAppFactoryDatabase();
  return database.transaction(() => {
    database.prepare(
      "UPDATE publication_jobs SET status='queued',stage='queued',step='Worker 已重启，等待继续发布',lease_token=NULL,lease_expires_at=NULL,updated_at=? WHERE status='running' AND lease_expires_at<?",
    ).run(new Date(now).toISOString(), now);
    const job = database.prepare("SELECT * FROM publication_jobs WHERE status='queued' ORDER BY created_at LIMIT 1").get() as JobRow | undefined;
    if (!job) return null;
    const leaseToken = randomUUID();
    database.prepare(
      "UPDATE publication_jobs SET status='running',attempts=attempts+1,lease_token=?,lease_expires_at=?,updated_at=? WHERE id=? AND status='queued'",
    ).run(leaseToken, now + 90_000, new Date(now).toISOString(), job.id);
    return { ...job, status: "running" as const, attempts: job.attempts + 1, lease_token: leaseToken, lease_expires_at: now + 90_000 };
  })();
}

export function updatePublicationProgress(
  job: JobRow,
  stage: PublicationStage,
  step: string,
  completed: number,
) {
  const updated = getAppFactoryDatabase().prepare(
    "UPDATE publication_jobs SET stage=?,step=?,completed=?,updated_at=? WHERE id=? AND status='running' AND lease_token=? AND lease_expires_at>?",
  ).run(stage, step, completed, new Date().toISOString(), job.id, job.lease_token, Date.now());
  if (!updated.changes) throw new Error("发布任务已取消或租约失效");
  appendPublicationEvent(job.id, stage, "info", step);
}

export function heartbeatPublicationJob(job: JobRow) {
  return getAppFactoryDatabase().prepare(
    "UPDATE publication_jobs SET lease_expires_at=?,updated_at=? WHERE id=? AND status='running' AND lease_token=? AND lease_expires_at>?",
  ).run(Date.now() + 90_000, new Date().toISOString(), job.id, job.lease_token, Date.now()).changes > 0;
}

export function failPublicationJob(job: JobRow, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  getAppFactoryDatabase().prepare(
    "UPDATE publication_jobs SET status='failed',stage='completed',step='发布失败',error=?,lease_token=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND status='running' AND lease_token=?",
  ).run(message.slice(0, 2000), new Date().toISOString(), job.id, job.lease_token);
  appendPublicationEvent(job.id, "completed", "error", message.slice(0, 2000));
}

export function completePublicationJob(job: JobRow, result: PublicationResult) {
  getAppFactoryDatabase().prepare(
    "UPDATE publication_jobs SET status='succeeded',stage='completed',step='发布完成',completed=7,release_id=?,result_json=?,lease_token=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND status='running' AND lease_token=?",
  ).run(result.releaseId, JSON.stringify(result), new Date().toISOString(), job.id, job.lease_token);
  appendPublicationEvent(job.id, "completed", "success", "应用已发布到应用中心");
}

export function cancelPublicationJob(id: string): PublicationJob | null {
  const result = getAppFactoryDatabase().prepare(
    "UPDATE publication_jobs SET status='cancelled',stage='completed',step='已取消',lease_token=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND status IN ('queued','running')",
  ).run(new Date().toISOString(), id);
  if (result.changes) appendPublicationEvent(id, "completed", "error", "发布任务已取消");
  return getPublicationJob(id);
}

export function isPublicationJobActive(job: Pick<JobRow, "id" | "lease_token">) {
  return Boolean(getAppFactoryDatabase().prepare(
    "SELECT 1 FROM publication_jobs WHERE id=? AND status='running' AND lease_token=? AND lease_expires_at>?",
  ).get(job.id, job.lease_token, Date.now()));
}

export function createPublicationRelease(projectId: string, jobId: string, artifactPath: string): PublicationRelease {
  const database = getAppFactoryDatabase();
  const version = (database.prepare("SELECT COALESCE(MAX(version),0) AS value FROM publication_releases WHERE project_id=?").get(projectId) as { value: number }).value + 1;
  const id = `publication-release-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  database.prepare(
    "INSERT INTO publication_releases(id,project_id,job_id,version,artifact_path,created_at) VALUES (?,?,?,?,?,?)",
  ).run(id, projectId, jobId, version, artifactPath, createdAt);
  return releaseDto({ id, project_id: projectId, job_id: jobId, version, artifact_path: artifactPath, created_at: createdAt });
}

export function getLatestPublicationRelease(projectId: string): PublicationRelease | null {
  const row = getAppFactoryDatabase().prepare(
    "SELECT * FROM publication_releases WHERE project_id=? ORDER BY version DESC LIMIT 1",
  ).get(projectId) as ReleaseRow | undefined;
  return row ? releaseDto(row) : null;
}

export function getPublishedPort(projectId: string): number | null {
  const row = getAppFactoryDatabase().prepare("SELECT published_port FROM projects WHERE id=?").get(projectId) as { published_port: number | null } | undefined;
  return row?.published_port ?? null;
}

export function setPublishedPort(projectId: string, port: number) {
  getAppFactoryDatabase().prepare("UPDATE projects SET published_port=?,updated_at=? WHERE id=?").run(port, new Date().toISOString(), projectId);
}

export function listRunningPublicationDeployments(): PublicationDeployment[] {
  return (getAppFactoryDatabase().prepare(
    "SELECT * FROM publication_deployments WHERE status='running' ORDER BY created_at",
  ).all() as DeploymentRow[]).map(deploymentDto);
}

export function getPublicationRelease(id: string): PublicationRelease | null {
  const row = getAppFactoryDatabase().prepare("SELECT * FROM publication_releases WHERE id=?").get(id) as ReleaseRow | undefined;
  return row ? releaseDto(row) : null;
}

export function createPublicationDeployment(
  projectId: string,
  releaseId: string,
  port: number,
  url: string,
  pid: number | null,
  status: PublicationDeployment["status"],
): PublicationDeployment {
  const id = `publication-deployment-${randomUUID()}`;
  const now = new Date().toISOString();
  getAppFactoryDatabase().prepare(
    "INSERT INTO publication_deployments(id,project_id,release_id,status,port,url,pid,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(id, projectId, releaseId, status, port, url, pid, now, now);
  return deploymentDto({ id, project_id: projectId, release_id: releaseId, status, port, url, pid, created_at: now, updated_at: now });
}

export function getLatestPublicationDeployment(projectId: string): PublicationDeployment | null {
  const row = getAppFactoryDatabase().prepare(
    "SELECT * FROM publication_deployments WHERE project_id=? ORDER BY created_at DESC LIMIT 1",
  ).get(projectId) as DeploymentRow | undefined;
  return row ? deploymentDto(row) : null;
}

export function updatePublicationDeployment(id: string, status: PublicationDeployment["status"], pid: number | null) {
  getAppFactoryDatabase().prepare(
    "UPDATE publication_deployments SET status=?,pid=?,updated_at=? WHERE id=?",
  ).run(status, pid, new Date().toISOString(), id);
}
