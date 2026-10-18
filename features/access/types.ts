export const visibilityOptions = [
  {
    value: "private",
    label: "仅自己可见",
    description: "只有你可以在平台中查看和打开",
  },
  {
    value: "internal",
    label: "内部可见",
    description: "内部用户、应用管理员和超级管理员可使用",
  },
  {
    value: "all",
    label: "全部用户可见",
    description: "所有已登录账号，包括外部用户均可使用",
  },
] as const;
export type Visibility = (typeof visibilityOptions)[number]["value"];
export type ResourcePolicy = {
  ownerId: string;
  visibility: Visibility;
  revision: number;
};
