import { createSkillTool } from "@/features/services/tools/create-skill";
import { skillsFlowTool } from "@/features/services/tools/skills-flow";
import { towerMatchSearch } from "@/features/services/tools/tower-match";

// 此处只维护稳定 handlerKey 到代码实现的映射，能力状态与展示信息以数据库 Registry 为准。
const implementations = {
  "tower.match.search": towerMatchSearch,
  create_skill: createSkillTool,
  skills_flow: skillsFlowTool,
} as const;

export function getCapabilityImplementation(handlerKey: string) {
  return implementations[handlerKey as keyof typeof implementations];
}

export function hasCapabilityImplementation(handlerKey: string) {
  return handlerKey in implementations;
}
