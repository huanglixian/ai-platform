import { serviceRecords } from "@/features/services/data";
import { skillRecords } from "@/features/skills/data";
import { toolRecords } from "@/features/tools/data";
import type { WorkbenchCapabilitySummary } from "@/features/workbench/chat-types";

const maxItemsPerKind = 10;

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function scoreCapability(item: WorkbenchCapabilitySummary, query: string) {
  const normalizedQuery = normalizeText(query);
  const haystack = normalizeText(
    [item.name, item.description, item.category, item.invokeType].join(" "),
  );

  let score = item.featured ? 2 : 0;
  if (haystack.includes(normalizedQuery)) {
    score += 8;
  }

  for (const char of normalizedQuery) {
    if (haystack.includes(char)) {
      score += 1;
    }
  }

  return score;
}

function toContextBlock(title: string, items: WorkbenchCapabilitySummary[]) {
  if (!items.length) {
    return `${title}：无匹配候选`;
  }

  const lines = items.map((item) =>
    [
      `- id: ${item.id}`,
      `名称: ${item.name}`,
      `分类: ${item.category}`,
      `调用方式: ${item.invokeType}`,
      `说明: ${item.description}`,
    ].join("；"),
  );

  return `${title}：\n${lines.join("\n")}`;
}

export function getWorkbenchCapabilityContext(query: string) {
  const capabilities: WorkbenchCapabilitySummary[] = [
    ...skillRecords.map((item) => ({ ...item, kind: "skill" as const })),
    ...toolRecords.map((item) => ({ ...item, kind: "tool" as const })),
    ...serviceRecords.map((item) => ({ ...item, kind: "service" as const })),
  ];

  const grouped = {
    skills: capabilities.filter((item) => item.kind === "skill"),
    tools: capabilities.filter((item) => item.kind === "tool"),
    services: capabilities.filter((item) => item.kind === "service"),
  };

  const pick = (items: WorkbenchCapabilitySummary[]) =>
    items
      .map((item) => ({ item, score: scoreCapability(item, query) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItemsPerKind)
      .map(({ item }) => item);

  return [
    toContextBlock("技能候选", pick(grouped.skills)),
    toContextBlock("通用工具候选", pick(grouped.tools)),
    toContextBlock("业务 API 候选", pick(grouped.services)),
  ].join("\n\n");
}
