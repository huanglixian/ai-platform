export type RunFeedback = {
  prompt: string;
  startedAt: number;
  status: "running" | "completed" | "failed" | "cancelled";
  runId?: string;
  message?: string;
};

export function formatRunElapsed(run: RunFeedback, now = Date.now()) {
  const elapsed = Math.max(0, Math.floor((now - run.startedAt) / 1000));
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getRunStatusText(run: RunFeedback) {
  if (run.status === "failed") return run.message || "任务执行失败";
  if (run.status === "cancelled") return "已停止当前任务";
  if (run.status === "completed") return run.message || "任务已完成";
  return run.message || "请求已提交，正在等待模型和工具执行";
}
