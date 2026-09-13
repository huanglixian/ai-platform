import path from "node:path";

const dataRoot = path.join(process.cwd(), "data");
const storageRoot = path.join(dataRoot, "storage");

export const dataPaths = {
  root: dataRoot,
  builtin: path.join(dataRoot, "builtin"),
  settings: path.join(dataRoot, "settings"),
  storage: storageRoot,
  assistantSettings: path.join(dataRoot, "settings", "assistant.json"),
  builtinSkills: path.join(dataRoot, "builtin", "skills"),
  agentHub: path.join(storageRoot, "agenthub"),
  agentHubSkills: path.join(storageRoot, "agenthub", "skills"),
  appFactory: path.join(storageRoot, "appfactory"),
  appFactoryPiSessions: path.join(storageRoot, "appfactory", "pi-sessions"),
  appFactoryPiAgent: path.join(storageRoot, "appfactory", "pi-agent"),
  appFactoryTranscripts: path.join(storageRoot, "appfactory", "transcripts"),
  appFactoryPreviewWorkspaces: path.join(storageRoot, "appfactory", "runtime", "previews"),
  appFactoryReleases: path.join(storageRoot, "appfactory", "releases"),
  knowHub: path.join(storageRoot, "knowhub"),
};
