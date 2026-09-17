import type { Principal } from "../auth/types.ts";

export const dataScopes = [
  "self",
  "department",
  "department_and_children",
  "all",
  "custom",
] as const;

export type DataScope = (typeof dataScopes)[number];

export type PermissionDefinition = {
  code: string;
  name: string;
  description?: string;
};

export type ResourceAccess = {
  ownerUserId?: string | null;
  ownerDepartmentId?: string | null;
};

export type CustomPolicy<T extends ResourceAccess> = (input: {
  principal: Principal;
  resource: T;
}) => boolean | Promise<boolean>;

export function isDataScope(value: unknown): value is DataScope {
  return typeof value === "string" && dataScopes.includes(value as DataScope);
}
