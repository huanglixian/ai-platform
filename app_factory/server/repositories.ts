import {
  bindCapability, claimJob, createBuild, createDeployment, createJob, createProject,
  createRelease, createRun, createSession, failActiveRun, finishJob, finishRun, getLatestBuild, getLatestDeployment,
  getLatestRelease, getProject, getSession, listJobs, listProjects, listSessions, setSessionStatus, setSessionTranscriptPath,
  updateBuild,
} from "./database";

export const projectRepository = { list: listProjects, create: createProject, get: getProject };
export const sessionRepository = { create: createSession, list: listSessions, get: getSession, setStatus: setSessionStatus, setTranscriptPath: setSessionTranscriptPath };
export const runRepository = { create: createRun, finish: finishRun, failActive: failActiveRun };
export const jobRepository = { list: listJobs, create: createJob, claim: claimJob, finish: finishJob };
export const buildRepository = { create: createBuild, latest: getLatestBuild, update: updateBuild };
export const releaseRepository = { create: createRelease, latest: getLatestRelease };
export const deploymentRepository = { create: createDeployment, latest: getLatestDeployment };
export const capabilityBindingRepository = { create: bindCapability };
