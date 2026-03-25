export type PlatformNavChild = {
  label: string;
  href?: string;
  disabled?: boolean;
};

export type PlatformNavGroup = {
  key: string;
  label: string;
  href?: string;
  items?: PlatformNavChild[];
};

export const platformNavGroups: PlatformNavGroup[] = [
  {
    key: "home",
    label: "首页",
    href: "/portal",
  },
  {
    key: "bots",
    label: "智能体",
    items: [
      { label: "自由体", href: "/bots" },
      { label: "工作流", href: "/workflows" },
    ],
  },
  {
    key: "data",
    label: "数据中心",
    items: [
      { label: "知识库", disabled: true },
      { label: "数据库", disabled: true },
    ],
  },
  {
    key: "capabilities",
    label: "能力中心",
    items: [
      { label: "工具中心", href: "/tools" },
      { label: "服务中心", href: "/services" },
      { label: "技能中心", href: "/skills" },
    ],
  },
  {
    key: "settings",
    label: "配置管理",
    items: [
      { label: "组织管理", disabled: true },
      { label: "角色管理", disabled: true },
      { label: "用户管理", disabled: true },
    ],
  },
];

export function getActiveNavGroup(pathname: string) {
  if (pathname === "/portal") {
    return "home";
  }

  if (pathname === "/bots" || pathname.startsWith("/bots/")) {
    return "bots";
  }

  if (pathname === "/workflows" || pathname.startsWith("/workflows/")) {
    return "bots";
  }

  if (pathname === "/tools" || pathname.startsWith("/tools/")) {
    return "capabilities";
  }

  if (pathname === "/services" || pathname.startsWith("/services/")) {
    return "capabilities";
  }

  if (pathname === "/skills" || pathname.startsWith("/skills/")) {
    return "capabilities";
  }

  return "home";
}
