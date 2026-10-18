export type PlatformNavChild = {
  label: string;
  href?: string;
  openInNewTab?: boolean;
  disabled?: boolean;
  hint?: string;
};

export type PlatformNavGroup = {
  key: string;
  permission?: Permission;
  label: string;
  href?: string;
  openInNewTab?: boolean;
  items?: PlatformNavChild[];
};

export const platformNavGroups: PlatformNavGroup[] = [
  {
    key: "home",
    label: "首页",
    href: "/",
  },
  {
    key: "workflows",
    permission: "platform.manage",
    label: "业务流",
    href: "/workflows",
  },
  {
    key: "data",
    permission: "platform.manage",
    label: "数据中心",
    items: [
      {
        label: "知识库",
        href: "/knowhub",
        openInNewTab: true,
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
    permission: "platform.manage",
    label: "能力中心",
    items: [
      { label: "技能中心", href: "/skills", hint: "技能封装与能力分发" },
      { label: "通用工具", href: "/tools", hint: "工具接入与调度能力" },
      { label: "业务API", href: "/services", hint: "外部服务与连接配置" },
    ],
  },
  {
    key: "settings",
    permission: "users.manage",
    label: "配置管理",
    items: [
      { label: "角色管理", href: "/settings/roles", hint: "角色权限与职责控制" },
      { label: "用户管理", href: "/settings/users", hint: "用户账号与成员维护" },
    ],
  },
  {
    key: "appfactory",
    permission: "appfactory.use",
    label: "应用开发 ↗",
    href: "/appfactory",
    openInNewTab: true,
  },
];

export function getActiveNavGroup(pathname: string) {
  if (pathname === "/") {
    return "home";
  }

  if (pathname === "/workflows" || pathname.startsWith("/workflows/")) {
    return "workflows";
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
    return "capabilities";
  }

  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return "settings";
  }

  return "home";
}
import type { Permission } from "@/features/auth/types";
