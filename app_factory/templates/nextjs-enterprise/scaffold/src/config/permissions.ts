import type { PermissionDefinition } from "@/server/permissions/types";

export const permissionDefinitions = [
  { code: "system.users.read", name: "查看用户", description: "查看用户列表和基础信息" },
  { code: "system.users.manage", name: "管理用户", description: "创建、停用用户并分配角色" },
  { code: "system.departments.read", name: "查看部门", description: "查看部门树" },
  { code: "system.departments.manage", name: "管理部门", description: "维护部门树" },
  { code: "system.roles.read", name: "查看角色", description: "查看角色及权限" },
  { code: "system.roles.manage", name: "管理角色", description: "创建和编辑角色权限" },
  { code: "system.audit.read", name: "查看审计", description: "查看审计事件" },
] satisfies PermissionDefinition[];
