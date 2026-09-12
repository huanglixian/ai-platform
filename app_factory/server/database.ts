import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { deriveSessionTitle } from "@/app_factory/types/session";
import {
  DEFAULT_MODEL_PROFILE_ID,
  DEFAULT_THINKING_LEVEL,
  type ModelProfileId,
  type ThinkingLevel,
} from "./model-profiles";
import { SessionBusyError } from "./errors";

const dir = path.join(process.cwd(), "storage", "appfactory");
const file = path.join(dir, "appfactory.db");
let db: Database.Database | undefined;

export function getAppFactoryDatabase() {
  if (db) return db;
  fs.mkdirSync(dir, { recursive: true });
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', skill_profile TEXT NOT NULL DEFAULT 'nextjs-build', workspace_path TEXT NOT NULL, published_port INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'idle', harness TEXT NOT NULL DEFAULT 'pi', title TEXT NOT NULL DEFAULT '新对话', model_profile_id TEXT NOT NULL DEFAULT 'zhipu', transcript_path TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(project_id) REFERENCES projects(id));
    CREATE TABLE IF NOT EXISTS appfactory_settings (id INTEGER PRIMARY KEY CHECK (id = 1), default_model_profile TEXT NOT NULL DEFAULT 'zhipu', thinking_level TEXT NOT NULL DEFAULT 'high', updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT, status TEXT NOT NULL DEFAULT 'queued', input TEXT NOT NULL DEFAULT '', output TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(project_id) REFERENCES projects(id));
    CREATE TABLE IF NOT EXISTS capability_bindings (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, capability_id TEXT NOT NULL, version TEXT, config_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS publication_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      stage TEXT NOT NULL DEFAULT 'queued',
      step TEXT NOT NULL DEFAULT '等待发布',
      completed INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 7,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      lease_token TEXT,
      lease_expires_at INTEGER,
      release_id TEXT,
      result_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
    CREATE TABLE IF NOT EXISTS publication_events (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      stage TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(job_id) REFERENCES publication_jobs(id),
      UNIQUE(job_id, sequence)
    );
    CREATE TABLE IF NOT EXISTS publication_releases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      artifact_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(job_id) REFERENCES publication_jobs(id),
      UNIQUE(project_id, version)
    );
    CREATE TABLE IF NOT EXISTS publication_deployments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      release_id TEXT NOT NULL,
      status TEXT NOT NULL,
      port INTEGER NOT NULL,
      url TEXT NOT NULL,
      health_path TEXT NOT NULL,
      pid INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(release_id) REFERENCES publication_releases(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS publication_one_active_per_project
      ON publication_jobs(project_id) WHERE status IN ('queued', 'running');
    CREATE INDEX IF NOT EXISTS publication_events_by_job
      ON publication_events(job_id, sequence);
    CREATE INDEX IF NOT EXISTS publication_deployments_by_project
      ON publication_deployments(project_id, created_at DESC);
  `);
  const sessionColumns = db.prepare("PRAGMA table_info(sessions)").all() as { name: string }[];
  if (!sessionColumns.some((column) => column.name === "title")) {
    db.exec("ALTER TABLE sessions ADD COLUMN title TEXT NOT NULL DEFAULT '新对话'");
  }
  if (!sessionColumns.some((column) => column.name === "model_profile_id")) {
    db.exec("ALTER TABLE sessions ADD COLUMN model_profile_id TEXT NOT NULL DEFAULT 'zhipu'");
  }
  db.prepare("INSERT OR IGNORE INTO appfactory_settings (id,default_model_profile,thinking_level,updated_at) VALUES (1,?,?,?)").run(
    DEFAULT_MODEL_PROFILE_ID,
    DEFAULT_THINKING_LEVEL,
    new Date().toISOString(),
  );
  const projectColumns = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
  if (projectColumns.some((column) => column.name === "agenthub_mode")) {
    db.exec("ALTER TABLE projects DROP COLUMN agenthub_mode");
  }
  if (!projectColumns.some((column) => column.name === "published_port")) {
    db.exec("ALTER TABLE projects ADD COLUMN published_port INTEGER");
  }
  db.exec("DROP TABLE IF EXISTS jobs; DROP TABLE IF EXISTS builds; DROP TABLE IF EXISTS releases; DROP TABLE IF EXISTS deployments;");
  const publicationDeploymentColumns = db.prepare("PRAGMA table_info(publication_deployments)").all() as { name: string }[];
  if (!publicationDeploymentColumns.some((column) => column.name === "health_path")) {
    db.exec("ALTER TABLE publication_deployments ADD COLUMN health_path TEXT");
    db.prepare("UPDATE publication_deployments SET health_path='/' WHERE health_path IS NULL").run();
  }
  const missingHealthPaths = db.prepare("SELECT COUNT(*) AS count FROM publication_deployments WHERE health_path IS NULL OR health_path='' ").get() as { count: number };
  if (missingHealthPaths.count) throw new Error("发布部署缺少 healthPath，无法恢复运行时");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS publication_unique_project_port ON projects(published_port) WHERE published_port IS NOT NULL");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS runs_one_active_per_session ON runs(session_id) WHERE status='running'");
  return db;
}

export function listProjects() { return getAppFactoryDatabase().prepare("SELECT id,name,description,skill_profile as skillProfile,workspace_path as workspacePath,created_at as createdAt,updated_at as updatedAt FROM projects ORDER BY updated_at DESC").all(); }

export function createProject(input: { name: string; description?: string; skillProfile?: string }) {
  const id = `project-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const workspace = path.join(dir, "workspaces", id);
  fs.mkdirSync(path.join(workspace, "app"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "app.yaml"), `name: ${input.name}\nversion: 0.1.0\nruntime: nextjs\nentry: app/page.tsx\nhealthPath: /\ncapabilities: []\n`);
  fs.writeFileSync(path.join(workspace, "app/page.tsx"), `export default function Page(){return <main><h1>${input.name}</h1><p>由 AppFactory 创建的 Next.js 应用</p></main>}\n`);
  fs.writeFileSync(path.join(workspace, "package.json"), JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start", lint: "eslint app", typecheck: "tsc --noEmit" }, dependencies: { next: "16.3.3", react: "19.2.4", "react-dom": "19.2.4" }, devDependencies: { eslint: "^9", "eslint-config-next": "16.3.3", typescript: "^5", "@types/node": "^20", "@types/react": "^19", "@types/react-dom": "^19" } }, null, 2));
  fs.writeFileSync(path.join(workspace, "eslint.config.mjs"), `import { defineConfig, globalIgnores } from "eslint/config";\nimport nextVitals from "eslint-config-next/core-web-vitals";\nimport nextTs from "eslint-config-next/typescript";\nexport default defineConfig([...nextVitals, ...nextTs, globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"])]);\n`);
  fs.writeFileSync(path.join(workspace, "next.config.ts"), `const nextConfig = { output: "standalone", turbopack: { root: process.cwd() } };\nexport default nextConfig;\n`);
  fs.writeFileSync(path.join(workspace, "tsconfig.json"), JSON.stringify({ compilerOptions: { jsx: "preserve", strict: true, noEmit: true, moduleResolution: "bundler", module: "esnext", target: "es2020", lib: ["dom", "esnext"] }, include: ["app/**/*.tsx"] }, null, 2));
  fs.writeFileSync(path.join(workspace, "dev_todo.md"), "# 开发任务\n\n- [ ] 描述应用需求\n");
  fs.writeFileSync(path.join(workspace, "dev_status.md"), "# 开发状态\n\n- 状态：初始化\n");
  const baselineFiles = ["app.yaml", "app/page.tsx", "package.json", "eslint.config.mjs", "next.config.ts", "tsconfig.json", "dev_todo.md", "dev_status.md"];
  fs.writeFileSync(path.join(workspace, ".appfactory-baseline.json"), JSON.stringify(Object.fromEntries(baselineFiles.map((relative) => [relative, fs.readFileSync(path.join(workspace, relative), "utf8")])), null, 2));
  getAppFactoryDatabase().prepare("INSERT INTO projects (id,name,description,skill_profile,workspace_path,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").run(id, input.name, input.description ?? "", input.skillProfile ?? "nextjs-build", workspace, now, now);
  return getAppFactoryDatabase().prepare("SELECT id,name,description,skill_profile as skillProfile,workspace_path as workspacePath,created_at as createdAt,updated_at as updatedAt FROM projects WHERE id=?").get(id);
}

export function getProject(id: string) { return getAppFactoryDatabase().prepare("SELECT id,name,description,workspace_path as workspacePath FROM projects WHERE id=?").get(id) as { id: string; name: string; description: string; workspacePath: string } | undefined; }
export type AppFactoryModelSettings = {
  defaultModelProfileId: ModelProfileId;
  thinkingLevel: ThinkingLevel;
  updatedAt: string;
};

export function getAppFactoryModelSettings() {
  return getAppFactoryDatabase().prepare("SELECT default_model_profile as defaultModelProfileId,thinking_level as thinkingLevel,updated_at as updatedAt FROM appfactory_settings WHERE id=1").get() as AppFactoryModelSettings;
}

export function updateAppFactoryModelSettings(input: {
  defaultModelProfileId: ModelProfileId;
  thinkingLevel: ThinkingLevel;
}) {
  const updatedAt = new Date().toISOString();
  getAppFactoryDatabase().prepare("UPDATE appfactory_settings SET default_model_profile=?,thinking_level=?,updated_at=? WHERE id=1").run(input.defaultModelProfileId, input.thinkingLevel, updatedAt);
  return getAppFactoryModelSettings();
}

export function createSession(projectId: string) { const id = `session-${crypto.randomUUID()}`; const now = new Date().toISOString(); const { defaultModelProfileId } = getAppFactoryModelSettings(); getAppFactoryDatabase().prepare("INSERT INTO sessions (id,project_id,status,harness,title,model_profile_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").run(id, projectId, "idle", "pi", "新对话", defaultModelProfileId, now, now); return getAppFactoryDatabase().prepare("SELECT id,project_id as projectId,status,harness,title,model_profile_id as modelProfileId,transcript_path as transcriptPath,created_at as createdAt,updated_at as updatedAt FROM sessions WHERE id=?").get(id); }
export function listSessions(projectId: string) { return getAppFactoryDatabase().prepare("SELECT id,project_id as projectId,status,harness,title,model_profile_id as modelProfileId,transcript_path as transcriptPath,created_at as createdAt,updated_at as updatedAt FROM sessions WHERE project_id=? ORDER BY updated_at DESC,created_at DESC").all(projectId); }
export function getSession(id: string) { return getAppFactoryDatabase().prepare("SELECT s.*,p.workspace_path as cwd FROM sessions s JOIN projects p ON p.id=s.project_id WHERE s.id=?").get(id) as { id: string; project_id: string; cwd: string; model_profile_id: ModelProfileId } | undefined; }
export function createRun(projectId: string, sessionId: string, input: string) { const database = getAppFactoryDatabase(); const active = database.prepare("SELECT id FROM runs WHERE session_id=? AND status='running' LIMIT 1").get(sessionId); if (active) throw new SessionBusyError(); const id = `run-${crypto.randomUUID()}`; const now = new Date().toISOString(); try { database.prepare("INSERT INTO runs (id,project_id,session_id,status,input,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").run(id, projectId, sessionId, "running", input, now, now); } catch (error) { if ((error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE") throw new SessionBusyError(); throw error; } return database.prepare("SELECT * FROM runs WHERE id=?").get(id); }
export function hasActiveRunForProject(projectId: string) { return Boolean(getAppFactoryDatabase().prepare("SELECT 1 FROM runs WHERE project_id=? AND status='running' LIMIT 1").get(projectId)); }
export function finishRun(id: string, status: "completed" | "failed", output: string) { getAppFactoryDatabase().prepare("UPDATE runs SET status=?,output=?,updated_at=? WHERE id=?").run(status, output, new Date().toISOString(), id); return getAppFactoryDatabase().prepare("SELECT * FROM runs WHERE id=?").get(id); }
export function failActiveRun(sessionId: string, output = "任务已取消") { const row = getAppFactoryDatabase().prepare("SELECT id FROM runs WHERE session_id=? AND status='running' ORDER BY created_at DESC LIMIT 1").get(sessionId) as { id: string } | undefined; return row ? finishRun(row.id, "failed", output) : null; }
export function setSessionStatus(id: string, status: string) { getAppFactoryDatabase().prepare("UPDATE sessions SET status=?,updated_at=? WHERE id=?").run(status, new Date().toISOString(), id); }
export function setSessionTranscriptPath(id: string, transcriptPath: string) { getAppFactoryDatabase().prepare("UPDATE sessions SET transcript_path=?,updated_at=? WHERE id=?").run(transcriptPath, new Date().toISOString(), id); }
export function setSessionTitleFromPrompt(id: string, prompt: string) { const title = deriveSessionTitle(prompt); getAppFactoryDatabase().prepare("UPDATE sessions SET title=CASE WHEN title='新对话' THEN ? ELSE title END,updated_at=? WHERE id=?").run(title, new Date().toISOString(), id); }
export function bindCapability(projectId: string, capabilityId: string, version?: string) { const id = `binding-${crypto.randomUUID()}`; const now = new Date().toISOString(); getAppFactoryDatabase().prepare("INSERT INTO capability_bindings (id,project_id,capability_id,version,created_at) VALUES (?,?,?,?,?)").run(id, projectId, capabilityId, version ?? null, now); return getAppFactoryDatabase().prepare("SELECT * FROM capability_bindings WHERE id=?").get(id); }
export function listCapabilityBindings(projectId: string) { return getAppFactoryDatabase().prepare("SELECT capability_id as capabilityId,version FROM capability_bindings WHERE project_id=? ORDER BY created_at").all(projectId) as { capabilityId: string; version: string | null }[]; }
