import { claimJob, finishJob } from "../app_factory/server/database.ts";
const job = claimJob();
if (!job) { console.log("No queued AppFactory jobs"); process.exit(0); }
try { console.log(`Running ${job.kind} (${job.id})`); finishJob(job.id, "completed"); console.log(`Completed ${job.id}`); } catch (error) { finishJob(job.id, "failed", error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
