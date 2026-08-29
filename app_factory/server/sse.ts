export type SseEvent = {
  id?: string;
  event?: string;
  data: unknown;
};

export function formatSseEvent({ id, event, data }: SseEvent) {
  const payload =
    typeof data === "string" ? data : JSON.stringify(data) ?? "null";
  const lines = payload.split(/\r?\n/).map((line) => `data: ${line}`);
  return [
    ...(id ? [`id: ${id}`] : []),
    ...(event ? [`event: ${event}`] : []),
    ...lines,
    "",
    "",
  ].join("\n");
}
