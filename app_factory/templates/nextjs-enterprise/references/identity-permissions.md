# 用户、组织、角色与数据范围

职责严格分开：`src/server/organization` 管部门树和用户主部门；`src/server/permissions` 管多角色、权限、每个资源操作的数据范围。部门不是角色，也不自动授予权限。

首次 Bootstrap 会创建可改名的“公司本部”和首位超级管理员。默认角色为 `super_admin`、`user`；普通用户没有新业务的隐式权限。用户首版只有一个主部门，角色可多选。最后一个有效超级管理员不能被停用或移除该角色。

业务权限在 `src/config/permissions.ts` 声明，并由 Workspace layout 调用 `syncPermissionDefinitions()` 注册。管理员只能给角色分配已注册权限。服务端入口先取可信用户，再校验权限：

```ts
const principal = await requirePrincipal(request);
await requirePermission(principal, "customer.update");
```

数据范围由同一资源操作的角色授权并集决定：`self`、`department`、`department_and_children`、`all`、`custom`。业务记录自己选择归属字段，例如 `ownerUserId`、`ownerDepartmentId`；`self` 的实际含义必须在业务中明确。使用 `canAccessResource(principal, permission, resource, customPolicy)` 在读取、详情、导出、批量和修改路径执行范围判断。

`custom` 用于项目成员、被指派人、协作人等不能用部门表达的规则。业务可在 `src/config/resource-access.ts` 保留 policy，再由业务 service 显式传入；不要把这些规则塞进 organization。

系统管理页已接真实服务：`/system/users`、`/system/departments`、`/system/roles`、`/system/audit`。管理 Route Handler 仍必须调用 `requirePrincipal()` 与 `requirePermission()`，不能只隐藏导航或按钮。
