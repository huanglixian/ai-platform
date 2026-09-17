---
name: nextjs-enterprise
description: 在 Next.js 企业应用模板中开发业务模块，复用预置的登录、组织权限、持久化任务、消息、审计和紧凑企业 UI；仅用于该模板创建的项目。
---

# Next.js 企业应用开发指南

先读取当前 Workspace 的 `app.yaml`、`dev_status.md`、`dev_todo.md` 和已有业务代码。此模板是通用起始项目，不预置 CRM、合同或任何示例业务。

## 开发位置

- 新业务放 `src/app/<业务模块>/`：页面在 `page.tsx`，私有 UI 在 `_components/`，服务端业务逻辑、查询和 Job Handler 在 `_server/`。
- 多个业务模块共享、但不属于企业 Framework 的后端逻辑放 `src/server/shared/`。
- 跨业务 UI 复用 `src/components/ui/`、`layout/`、`patterns/`；纯函数和格式化工具放 `src/lib/`。
- `src/server/auth`、`organization`、`permissions`、`jobs`、`notifications`、`audit`、`db`、`env`、`validation`、`errors`、`observability` 与 `db/migrations/0001–0999` 是受管核心，不修改、替换或绕开。
- 业务权限目录、资源访问策略、导航和主题分别通过 `src/config/permissions.ts`、`resource-access.ts`、`navigation.ts`、`theme.ts` 扩展；业务迁移从 `1000_` 开始。

## 按需读取资料

| 任务 | 先读取 |
| --- | --- |
| 新模块、目录、共享服务或 Web/Worker 边界 | `references/architecture.md` |
| 用户、部门、角色、权限或数据范围 | `references/identity-permissions.md` |
| 导入导出、长任务、重试或通知 | `references/jobs-notifications.md` |
| 事务、并发、幂等和迁移 | `references/data-consistency.md` |
| 列表、详情、表单或主题 | `references/ui.md` |
| 环境变量、迁移、预览和发布 | `references/operations.md` |

## 基线规则

- 身份、操作权限和数据范围都在服务端执行；前端显隐只改善体验。
- 长任务走持久化 Job；共享业务状态落 PostgreSQL，不依赖进程内存或请求结束后的 Promise。
- 对竞争性操作使用事务、条件更新或版本检查；重复请求和 Worker retry 要有幂等策略。
- 优先组合现有 AppShell、页面 Pattern 与 Framework API，不重新造认证、角色、队列、消息或审计引擎。
- Secret 只由 `src/server/env` 在服务端读取，不写进源码、浏览器变量或发布产物。
- 修改后运行与改动相符的检查；不要删除测试、受管文件或发布保护来规避失败。
