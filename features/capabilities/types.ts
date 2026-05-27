export type CapabilityKind = "skill" | "tool" | "service";

export type CapabilityRecord = {
  id: string;
  name: string;
  description: string;
  invokeType: string;
  calls: string;
  featured: boolean;
  emoji: string;
  category: string;
};
