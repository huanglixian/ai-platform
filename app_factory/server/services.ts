import { buildRepository, capabilityBindingRepository, deploymentRepository, jobRepository, projectRepository, releaseRepository, runRepository, sessionRepository } from "./repositories";

export const projectService = projectRepository;
export const sessionService = sessionRepository;
export const runService = runRepository;
export const jobService = jobRepository;
export const deploymentService = deploymentRepository;
export const buildService = buildRepository;
export const releaseService = releaseRepository;
export const capabilityBindingService = capabilityBindingRepository;
