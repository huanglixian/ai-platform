import { generateText } from "ai";
import { z } from "zod";

import { listApplications } from "@/features/apps/server";
import { listCapabilities } from "@/features/capabilities/server";
import { getActiveModelRuntime } from "@/features/models/provider";
import { listEnabledSkills } from "@/features/skills/registry";
import type { AssistantRecommendation, AssistantRecommendationKind } from "./chat-types";

type DispatchCandidate = {
  kind: AssistantRecommendationKind;
  id: string;
  name: string;
  description: string;
  href: string;
  actionLabel: string;
  openInNewTab: boolean;
  returnToHome: boolean;
};

export type AssistantDispatchDecision =
  | { action: "use_skill"; skillId: string }
  | { action: "recommend"; recommendations: AssistantRecommendation[] }
  | { action: "no_match" };

const recommendationSchema = z.object({
  kind: z.enum(["application", "skill", "service"]),
  id: z.string().min(1),
  reason: z.string().trim().min(1).max(80),
});

const dispatchSchema = z.object({
  action: z.enum(["use_skill", "recommend", "no_match"]),
  skillId: z.string().nullable().optional(),
  recommendations: z.array(recommendationSchema).max(3).default([]),
});

function normalizeDescription(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

function getCandidates(): DispatchCandidate[] {
  const applications = listApplications().map((app) => {
    const unavailableExternalApp = app.source === "external" && app.launchStatus !== "running";
    return {
      kind: "application" as const,
      id: app.id,
      name: app.name,
      description: normalizeDescription(app.description),
      href: unavailableExternalApp ? "/" : app.url,
      actionLabel: unavailableExternalApp ? "前往首页管理" : "打开应用",
      openInNewTab: !unavailableExternalApp,
      returnToHome: unavailableExternalApp,
    };
  });
  const skills = listEnabledSkills().map((skill) => ({
    kind: "skill" as const,
    id: skill.id,
    name: skill.name,
    description: normalizeDescription(skill.description),
    href: `/skills/${encodeURIComponent(skill.id)}`,
    actionLabel: "查看技能",
    openInNewTab: false,
    returnToHome: false,
  }));
  const services = listCapabilities("service")
    .filter((service) => service.status === "active" && service.availability === "available")
    .map((service) => ({
      kind: "service" as const,
      id: service.id,
      name: service.name,
      description: normalizeDescription(service.description),
      href: "/services",
      actionLabel: "查看业务 API",
      openInNewTab: false,
      returnToHome: false,
    }));
  return [...applications, ...skills, ...services];
}

function buildDispatchPrompt(userInput: string, candidates: DispatchCandidate[]) {
  const skills = listEnabledSkills().map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: normalizeDescription(skill.description),
    triggers: skill.triggers,
  }));

  return [
    "你是 AI 业务编排平台的请求分发器，不回答用户问题，不执行任务。",
    "你必须只输出一行 JSON，不要输出 Markdown、代码块或解释。",
    'JSON 格式：{"action":"use_skill|recommend|no_match","skillId":"技能 ID 或 null","recommendations":[{"kind":"application|skill|service","id":"候选 ID","reason":"不超过 80 字的匹配理由"}]}',
    "",
    "规则：",
    "1. 用户明确要求处理具体任务，且可执行技能与任务明显匹配时，返回 use_skill；此时 recommendations 必须为空。",
    "2. 未达到执行技能条件、但某个应用、技能或业务 API 与用户的明确目标明显相关时，返回 recommend；只选择 1 到 3 个最直接的候选。",
    "3. 仅泛泛询问平台有什么用、缺少具体业务目标、只是闲聊，或没有明显候选时，返回 no_match。",
    "4. 不要为了推荐而勉强匹配；不要推荐通用工具。",
    "5. use_skill 优先于 recommend。",
    "",
    "可执行技能：",
    JSON.stringify(skills),
    "",
    "候选列表：",
    JSON.stringify(candidates.map(({ kind, id, name, description }) => ({ kind, id, name, description }))),
    "",
    "用户当前请求：",
    userInput,
  ].join("\n");
}

function fallbackDecision(): AssistantDispatchDecision {
  return { action: "no_match" };
}

function parseDecision(text: string) {
  const jsonText = text.trim().match(/\{[\s\S]*\}/)?.[0] ?? text.trim();
  return dispatchSchema.safeParse(JSON.parse(jsonText));
}

export async function dispatchAssistantRequest(userInput: string): Promise<AssistantDispatchDecision> {
  const candidates = getCandidates();
  const skills = new Set(listEnabledSkills().map((skill) => skill.id));

  try {
    const modelRuntime = getActiveModelRuntime();
    const result = await generateText({
      model: modelRuntime.model,
      prompt: buildDispatchPrompt(userInput, candidates),
      temperature: 0,
      providerOptions: modelRuntime.providerOptions,
    });
    const parsed = parseDecision(result.text);

    if (!parsed.success) return fallbackDecision();
    const decision = parsed.data;

    if (decision.action === "use_skill" && decision.skillId && skills.has(decision.skillId)) {
      return { action: "use_skill", skillId: decision.skillId };
    }

    if (decision.action !== "recommend") return fallbackDecision();

    const candidatesByKey = new Map(candidates.map((candidate) => [`${candidate.kind}:${candidate.id}`, candidate]));
    const recommendations = decision.recommendations.flatMap((item) => {
      const candidate = candidatesByKey.get(`${item.kind}:${item.id}`);
      return candidate ? [{ ...candidate, reason: item.reason }] : [];
    }).filter((item, index, all) => all.findIndex((candidate) => candidate.kind === item.kind && candidate.id === item.id) === index);

    return recommendations.length ? { action: "recommend", recommendations } : fallbackDecision();
  } catch {
    return fallbackDecision();
  }
}
