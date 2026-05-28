import { towerMatchSearch } from "./tools/tower-match";

// 汇总平台的所有 AI 可用业务 Tools
// 映射的键必须与 skill.json 中 allowedTools 中的项完全一致
export const toolRegistry: Record<string, any> = {
  "tower.match.search": towerMatchSearch,
};
