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

/** 将 Pi 的增量事件整理成用户可读的稳定时间线。 */
export function mergeWorkspaceEvents(events: WorkspaceEvent[]) {
  const next: WorkspaceEvent[] = [];
  const activityIndices = new Map<string, number>();

  for (const event of events) {
    const activityKey =
      event.type === "activity" && event.runId && event.activity?.id
        ? `${event.runId}:${event.activity.id}`
        : undefined;

    if (activityKey) {
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
