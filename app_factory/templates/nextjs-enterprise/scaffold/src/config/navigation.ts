import type { LucideIcon } from "lucide-react";
import { Building2, ClipboardList, ShieldCheck, Users } from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  permission: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  { href: "/system/users", label: "用户", permission: "system.users.read", icon: Users },
  { href: "/system/departments", label: "部门", permission: "system.departments.read", icon: Building2 },
  { href: "/system/roles", label: "角色", permission: "system.roles.read", icon: ShieldCheck },
  { href: "/system/audit", label: "审计", permission: "system.audit.read", icon: ClipboardList },
];
