import type { CapabilityKind } from "@/features/capabilities/types";

export type AssistantChatRole = "user" | "assistant";

export type AssistantChatMessage = {
  id?: string;
  role: AssistantChatRole;
  content: string;
  outcome?: AssistantChatOutcome;
};

export type AssistantChatRequest = {
  messages: AssistantChatMessage[];
};

export type AssistantCapabilitySummary = {
  id: string;
  kind: CapabilityKind;
  name: string;
  description: string;
  category: string;
  invokeType: string;
  featured: boolean;
};

export type AssistantRuntimeState = {
  activeSkillId?: string;
  skillStatus?: 'idle' | 'collecting_input' | 'running_tool' | 'completed' | 'failed';
  startedAtMessageIndex?: number;
};

export type AssistantRecommendationKind = "application" | "skill" | "service";

export type AssistantRecommendation = {
  kind: AssistantRecommendationKind;
  id: string;
  name: string;
  description: string;
  reason: string;
  href: string;
  actionLabel: string;
  openInNewTab: boolean;
  returnToHome: boolean;
};

export type AssistantChatOutcome =
  | { type: "recommendation"; recommendations: AssistantRecommendation[] }
  | { type: "no_match" };

export type AssistantChatResponse = {
  content: string;
  outcome?: AssistantChatOutcome;
};
