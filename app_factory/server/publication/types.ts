export const publicationStages = [
  "queued",
  "validating",
  "building",
  "packaging",
  "deploying",
  "checking",
  "registering",
  "completed",
] as const;

export type PublicationStage = (typeof publicationStages)[number];
export type PublicationStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type PublicationEventLevel = "info" | "success" | "error";

export type PublicationEvent = {
  id: string;
  sequence: number;
  stage: PublicationStage;
  level: PublicationEventLevel;
  message: string;
  createdAt: string;
};

export type PublicationJob = {
  id: string;
  projectId: string;
  status: PublicationStatus;
  stage: PublicationStage;
  step: string;
  completed: number;
  total: number;
  error: string | null;
  attempts: number;
  releaseId: string | null;
  result: PublicationResult | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicationResult = {
  applicationId: string;
  releaseId: string;
  entryUrl: string;
  applicationCenterUrl: string;
};

export type PublicationRelease = {
  id: string;
  projectId: string;
  jobId: string;
  version: number;
  artifactPath: string;
  createdAt: string;
};

export type PublicationDeployment = {
  id: string;
  projectId: string;
  releaseId: string;
  status: "running" | "stopped" | "failed";
  port: number;
  url: string;
  healthPath: string;
  pid: number | null;
  createdAt: string;
  updatedAt: string;
};
