import type { CapabilityKind } from "@/features/capabilities/types";

export type AssistantChatRole = "user" | "assistant";

export type AssistantChatMessage = {
  id?: string;
  role: AssistantChatRole;
  content: string;
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
