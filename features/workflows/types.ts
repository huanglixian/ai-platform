export type WorkflowStatus = "运行中" | "待排期" | "草稿";

export type WorkflowMetric = {
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
};
