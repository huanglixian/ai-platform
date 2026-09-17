import type { CustomPolicy, ResourceAccess } from "@/server/permissions/types";

export type ResourceAccessRule<T extends ResourceAccess = ResourceAccess> = {
  permission: string;
  customPolicy?: CustomPolicy<T>;
};

// 业务模块在这里声明归属字段和 custom policy；不要把项目成员、被指派人等范围硬塞进部门规则。
export const resourceAccessRules: Record<string, ResourceAccessRule> = {};
