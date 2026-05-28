import type { CapabilityKind } from "@/features/capabilities/types";

export type WorkbenchChatRole = "user" | "assistant";

export type WorkbenchChatMessage = {
  id?: string;
  role: WorkbenchChatRole;
  content: string;
};

export type WorkbenchChatRequest = {
  messages: WorkbenchChatMessage[];
};

export type WorkbenchCapabilitySummary = {
  id: string;
  kind: CapabilityKind;
  name: string;
  description: string;
  category: string;
  invokeType: string;
  featured: boolean;
};

export type WorkbenchRuntimeState = {
  activeSkillId?: string;
  skillStatus?: 'idle' | 'collecting_input' | 'running_tool' | 'completed' | 'failed';
  startedAtMessageIndex?: number;
};
