export const permissionLabels = {
  "platform.internal": "内部成员",
  "platform.manage": "平台配置与能力管理",
  "users.manage": "用户管理",
  "roles.manage": "角色管理",
  "applications.manage": "应用管理",
  "applications.govern": "私有应用治理",
  "appfactory.use": "个人应用开发与发布",
} as const;

export type Permission = keyof typeof permissionLabels;
export type RoleCode =
  | "super_admin"
  | "app_admin"
  | "internal_user"
  | "external_user";
export type Principal = {
  id: string;
  username: string;
  displayName: string;
  roles: RoleCode[];
  permissions: Permission[];
};

export const builtInRoles = [
  {
    code: "super_admin",
    name: "超级管理员",
    description: "平台治理、账号和应用管理",
    permissions: Object.keys(permissionLabels) as Permission[],
  },
  {
    code: "app_admin",
    name: "应用管理员",
    description: "应用接入、运行和访问范围管理",
    permissions: [
      "platform.internal",
      "applications.manage",
      "appfactory.use",
    ] as Permission[],
  },
  {
    code: "internal_user",
    name: "内部用户",
    description: "使用内部应用，开发和发布个人应用",
    permissions: ["platform.internal", "appfactory.use"] as Permission[],
  },
  {
    code: "external_user",
    name: "外部用户",
    description: "使用向全部用户开放的应用",
    permissions: [] as Permission[],
  },
] as const;

export function hasPermission(
  user: Principal | null | undefined,
  permission: Permission,
) {
  return user?.permissions.includes(permission) ?? false;
}
