import { jobRepository } from "../app_factory/server/repositories.ts";
const job = jobRepository.claim();
if (!job) { console.log("No queued AppFactory jobs"); process.exit(0); }
try { console.log(`Running ${job.kind} (${job.id})`); jobRepository.finish(job.id, "completed"); console.log(`Completed ${job.id}`); } catch (error) { jobRepository.finish(job.id, "failed", error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
