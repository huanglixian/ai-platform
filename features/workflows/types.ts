export type WorkflowStatus = "运行中" | "待排期" | "草稿";

export type WorkflowMetric = {
  label: string;
  value: string;
};

export type WorkflowNodeKind =
  | "start"
  | "llm"
  | "tool"
  | "condition"
  | "template"
  | "end";

export type WorkflowNode = {
  id: string;
  kind: WorkflowNodeKind;
  title: string;
  subtitle: string;
  detail: string;
  output?: string;
};

export type WorkflowEdge = {
  from: string;
  to: string;
  label?: string;
};

export type WorkflowRunLog = {
  label: string;
  value: string;
};

export type WorkflowRecord = {
  id: string;
  name: string;
  code: string;
  emoji: string;
  description: string;
  status: WorkflowStatus;
  metrics: WorkflowMetric[];
  tags: string[];
  summary: {
    scenario: string;
    input: string;
    output: string;
  };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  runLogs: WorkflowRunLog[];
};
