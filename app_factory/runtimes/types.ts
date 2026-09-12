export type RuntimeId = "nextjs" | "static-web";

export type RuntimeCommand = {
  executable: string;
  args: string[];
  cwd: string;
};

export type RuntimeBuildLog = {
  stage: "lint" | "typecheck" | "build" | "package";
  output: string;
};

export type RuntimeBuildOptions = {
  onLog: (log: RuntimeBuildLog) => void;
  signal?: AbortSignal;
};

export type AppRuntime = {
  id: RuntimeId;
  applicationRuntime: string;
  createPreviewCommand: (workspacePath: string, port: number) => RuntimeCommand;
  buildRelease: (
    workspacePath: string,
    releasePath: string,
    options: RuntimeBuildOptions,
  ) => Promise<void>;
  createReleaseCommand: (releasePath: string, port: number) => RuntimeCommand;
};
