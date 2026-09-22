# 运行、发布与 PostgreSQL 生命周期

运行环境只在服务端提供 `DATABASE_URL`、`APP_AUTH_SECRET`、`ENTERPRISE_BOOTSTRAP_TOKEN`；不要把真实值写入 Workspace、`.env.example`、浏览器变量或 Release。`APP_SECURE_COOKIES`、会话 TTL 和 Worker 并发可按部署环境调整。

每个新项目会在创建 Workspace 时分配稳定的 Schema 名，并写入受管 Framework 与 `app.yaml`；这一步不连接数据库。首次 Preview、首次发布及以后每次重新准备运行环境时，平台都会在该 Schema 上受控执行受管和业务迁移：创建 Schema、加 advisory lock、校验 checksum、只追加新迁移。Web 在迁移成功后才启动；有 `workerEntry` 时才额外启动应用自己的 Worker。Preview 和 Release 使用同一应用 Schema，Preview 的业务写操作会保留；它不是隔离的演示数据库。

更新应用不会重建 Schema。删除 AI Platform 中的应用只停止 Release 和移除目录入口，默认保留项目源码、Release 历史和 PostgreSQL Schema；真正 `DROP SCHEMA` 必须是未来单独确认的 purge 操作。

当前平台已实现每应用独立 Schema，但尚未代管每应用独立 PostgreSQL Role/Credential：部署时仍由宿主提供 `DATABASE_URL`，该账号需要访问目标 Schema。生产环境应由数据库管理员为每个应用分配受限 Role，并让其默认 `search_path` / 权限只覆盖本应用 Schema；不能把“仅切换 search_path”当成完整权限隔离。

常用命令：`npm run lint`、`npm run typecheck`、`npm run build`；数据库迁移由发布流程执行，也可在已配置的应用目录运行 `npm run db:migrate`。未启用 Job 时不要启动空 Worker。
