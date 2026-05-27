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
    label: "工作台",
    href: "/workbench",
  },
  {
    key: "data",
    label: "数据中心",
    items: [
      {
        label: "知识库",
        href: "/knowhub",
        hint: "知识接入、处理、检索与发布",
      },
      {
        label: "数据库",
        disabled: true,
        hint: "结构化数据接入、清洗与管理",
      },
    ],
  },
  {
    key: "capabilities",
    label: "能力中心",
    items: [
      { label: "通用工具", href: "/tools", hint: "工具接入与调度能力" },
      { label: "业务API", href: "/services", hint: "外部服务与连接配置" },
    ],
  },
  {
    key: "agents",
    label: "智能体",
    items: [
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
  if (
    pathname === "/" ||
    pathname === "/workbench" ||
    pathname.startsWith("/workbench/")
  ) {
    return "home";
  }

  if (pathname === "/knowhub" || pathname.startsWith("/knowhub/")) {
    return "data";
  }

  if (pathname === "/tools" || pathname.startsWith("/tools/")) {
    return "capabilities";
  }

  if (pathname === "/services" || pathname.startsWith("/services/")) {
    return "capabilities";
  }

  if (pathname === "/skills" || pathname.startsWith("/skills/")) {
    return "agents";
  }

  return "home";
}
