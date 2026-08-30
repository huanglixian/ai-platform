import type { HarnessActivity } from "../../../app_factory/types/harness";

export type WorkspaceEvent = {
  type: string;
  content: string;
  timestamp?: string;
  runId?: string;
  sequence?: number;
  stream?: "assistant";
  activity?: HarnessActivity;
};

export type WorkspaceRunSummary = {
  runId: string;
  activities: WorkspaceEvent[];
  status: "running" | "completed" | "failed";
  terminalEvent?: WorkspaceEvent;
};

export function shouldShowRunSummary(summary: WorkspaceRunSummary) {
  return summary.status === "failed" || summary.activities.length > 0;
}

export function getWorkspaceRunStepCount(summary: WorkspaceRunSummary) {
  return summary.activities.filter((event) => !isPreparationActivity(event)).length;
}

/** 将 Pi 的增量事件整理成用户可读的稳定时间线。 */
export function mergeWorkspaceEvents(events: WorkspaceEvent[]) {
  const next: WorkspaceEvent[] = [];
  const activityIndices = new Map<string, number>();
  const preparationIndices = new Map<string, number>();

  for (const event of events) {
    const activityKey =
      event.type === "activity" && event.runId && event.activity?.id
        ? `${event.runId}:${event.activity.id}`
        : undefined;

    if (activityKey) {
      if (isPreparationActivity(event)) {
        const existingPreparationIndex = preparationIndices.get(activityKey);
        if (existingPreparationIndex !== undefined) {
          next[existingPreparationIndex] = event;
        } else {
          preparationIndices.set(activityKey, next.length);
          next.push(event);
        }
        continue;
      }
      const existingIndex = activityIndices.get(activityKey);
      if (existingIndex !== undefined) {
        const previous = next[existingIndex];
        next[existingIndex] = {
          ...previous,
          ...event,
          activity: { ...previous.activity!, ...event.activity! },
        };
      } else {
        activityIndices.set(activityKey, next.length);
        next.push(event);
      }
      continue;
    }

    const previous = next[next.length - 1];
    if (
      event.type === "text" &&
      previous?.type === "text" &&
      event.runId &&
      previous.runId === event.runId
    ) {
      next[next.length - 1] = {
        ...previous,
        content: previous.content + event.content,
      };
    } else {
      next.push(event);
    }
  }

  return next;
}

function isPreparationActivity(event: WorkspaceEvent) {
  return event.type === "activity" && event.content.startsWith("准备调用 ");
}

export function getWorkspaceHistoryEvents(
  events: WorkspaceEvent[],
  activeRunId?: string,
) {
  const merged = mergeWorkspaceEvents(events);
  const scopedUserContents = new Set(
    merged
      .filter((event) => event.type === "user" && event.runId)
      .map((event) => event.content.trim()),
  );
  let hasLegacyUser = false;
  return merged.filter((event) => {
    if (isLegacySystemEvent(event)) return false;
    if (event.type === "user" && !event.runId) {
      hasLegacyUser = true;
      if (scopedUserContents.has(event.content.trim())) return false;
    }
    if (event.type === "text" && !event.runId && !hasLegacyUser) return false;
    if (event.type === "activity") return false;
    if (
      activeRunId &&
      event.runId === activeRunId &&
      (event.type === "completed" || event.type === "error")
    ) {
      return false;
    }
    return true;
  });
}

function isLegacySystemEvent(event: WorkspaceEvent) {
  const content = event.content.trim();
  if (event.type === "completed" && !event.runId) return true;
  if (event.type !== "text" || event.runId) return false;
  return (
    content === "LLM 连接成功" ||
    /^Warning: No project session found with id .+; creating a new session with that id\.$/.test(
      content,
    )
  );
}

export function buildWorkspaceRunSummaries(events: WorkspaceEvent[]) {
  const summaries = new Map<string, WorkspaceRunSummary>();
  for (const event of mergeWorkspaceEvents(events)) {
    if (!event.runId) continue;
    let summary = summaries.get(event.runId);
    if (!summary) {
      summary = { runId: event.runId, activities: [], status: "running" };
      summaries.set(event.runId, summary);
    }
    if (event.type === "activity") summary.activities.push(event);
    if (event.type === "completed") {
      summary.status = "completed";
      summary.terminalEvent = event;
    }
    if (event.type === "error") {
      summary.status = "failed";
      summary.terminalEvent = event;
    }
  }
  return [...summaries.values()];
}
