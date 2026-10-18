export const SKINS = [
  {
    id: "blue",
    name: "默认蓝",
    title: "AgentHub · 智能体中台",
    subtitle: "基于数据与集成的企业级平台",
    logo: "/branding/default-logo.svg",
    logoAlt: "AgentHub",
    workspaceLabel: "INTELLIGENT WORKSPACE",
  },
  {
    id: "guangyu",
    name: "广昱红",
    title: "广昱 · 智能体中台",
    subtitle: "企业智能协同平台",
    logo: "/branding/guangyu-logo.png",
    logoAlt: "广昱",
    workspaceLabel: "GUANGYU AI WORKSPACE",
  },
] as const;

export type SkinId = (typeof SKINS)[number]["id"];
export const DEFAULT_SKIN: SkinId = "guangyu";
export const SKIN_STORAGE_KEY = "ai-platform-skin";

export function isSkinId(value: unknown): value is SkinId {
  return SKINS.some((skin) => skin.id === value);
}

export function getSkin(id: SkinId) {
  return SKINS.find((skin) => skin.id === id)!;
}

// 首次绘制前应用配色，避免刷新时先显示另一套皮肤。
export const skinInitializationScript = `(()=>{let skin=${JSON.stringify(DEFAULT_SKIN)};try{const saved=localStorage.getItem(${JSON.stringify(SKIN_STORAGE_KEY)});if(${JSON.stringify(SKINS.map((skin) => skin.id))}.includes(saved))skin=saved;}catch{}document.documentElement.dataset.skin=skin;})()`;
