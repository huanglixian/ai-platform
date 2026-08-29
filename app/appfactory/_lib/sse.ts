export type ParsedSseEvent = {
  id?: string;
  event?: string;
  data: unknown;
};

export function parseSseBlock(block: string): ParsedSseEvent | null {
  let id: string | undefined;
  let event: string | undefined;
  const data: string[] = [];

  for (const rawLine of block.split(/\r?\n/)) {
    if (!rawLine || rawLine.startsWith(":")) continue;
    const separator = rawLine.indexOf(":");
    const field = separator === -1 ? rawLine : rawLine.slice(0, separator);
    const value = separator === -1 ? "" : rawLine.slice(separator + 1).replace(/^ /, "");
    if (field === "id") id = value;
    else if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }

  if (!data.length) return null;
  const rawData = data.join("\n");
  let parsedData: unknown = rawData;
  try {
    parsedData = JSON.parse(rawData);
  } catch {
    // 非 JSON 数据保留为文本，便于兼容诊断和心跳事件。
  }
  return { ...(id ? { id } : {}), ...(event ? { event } : {}), data: parsedData };
}
