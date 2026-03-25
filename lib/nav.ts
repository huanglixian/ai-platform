export type PlatformNavChild = {
  label: string;
  href?: string;
  disabled?: boolean;
  hint?: string;
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
      {
        label: "自由体",
        href: "/bots",
        hint: "独立智能体与角色管理",
      },
      {
        label: "工作流",
        href: "/workflows",
        hint: "流程编排与节点配置",
      },
    ],
  },
  {
    key: "data",
    label: "数据中心",
    items: [
      { label: "知识库", disabled: true, hint: "知识内容与检索配置" },
      { label: "数据库", disabled: true, hint: "结构化数据与表管理" },
    ],
  },
  {
    key: "capabilities",
    label: "能力中心",
    items: [
      { label: "工具中心", href: "/tools", hint: "工具接入与调度能力" },
      { label: "服务中心", href: "/services", hint: "外部服务与连接配置" },
      { label: "技能中心", href: "/skills", hint: "技能封装与能力分发" },
    ],
  },
  {
    key: "settings",
    label: "配置管理",
    items: [
      { label: "组织管理", disabled: true, hint: "组织结构与协作边界" },
      { label: "角色管理", disabled: true, hint: "角色权限与职责控制" },
      { label: "用户管理", disabled: true, hint: "用户账号与成员维护" },
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
