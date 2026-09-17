# 架构与目录

模板创建 Workspace 时，先复制 `scaffold/`，再把版本化 `framework/0.1.0` 合并为 `src/server/` 和 `db/migrations/0001_framework_identity.sql`。Workspace 是应用自己的副本；发布产物不从 AppFactory 读取源码。

```text
src/
├── app/<业务模块>/          # 页面、_components、_server、schemas、按需 actions
├── app/(workspace)/system/  # 模板预制的用户、部门、角色、审计管理页
├── server/                  # Framework 核心
│   └── shared/              # 应用合法的跨业务后端扩展区
├── components/{ui,layout,patterns}/
├── config/                  # 业务可修改声明
├── lib/                     # 与浏览器和服务端都兼容的纯工具
└── styles/
db/migrations/               # 业务迁移从 1000 起
worker/index.ts              # 需要 Job 时注册业务 Handler
```

`app/<模块>/_server` 不是 Next.js 的安全边界：不要从 Client Component 导入它，也不要把 DB、Secret 或请求生命周期耦合进跨模块共享逻辑。页面和 layout 默认是 Server Component；事件和浏览器状态只放进最小的 Client Component。

`src/server/shared` 可以放多个模块共用的业务服务，例如计费规则或人员选择器；不能放数据库连接、认证、授权、队列和运行时配置，这些已有受管 Framework。没有实际复用时不要先建空层。

`(auth)` 与 `(workspace)` 只用于不同 layout，不影响 URL，也不提供授权。业务模块名称来自当前需求，模板不会写死 customers、opportunities、contracts 等示例目录。
