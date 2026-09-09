# AI Platform 开发状态

## 项目概况

AI Platform 是单机演示系统。`/workbench` 为 AgentHub 工作台，`/appfactory` 用于以 Pi Harness 协作开发 Next.js 应用，并将可运行的 Release 自动发布到 `/apps` 应用中心。

## 技术与运行

- 技术栈：Next.js 16 App Router、TypeScript、SQLite、Pi Harness、Next.js standalone runtime。
- 启动：`npm run dev` 同时启动平台与 AppFactory 发布 Worker；发布不使用 Docker。
- 环境：`.env.local` 必须设置 `AGENT_HUB_BASE_URL`，单机默认是 `http://localhost:19844`。
- 数据：AppFactory 的项目、会话、任务与 Release 在 `storage/appfactory`；应用中心数据在 `storage/agenthub/agenthub.db`。

## 目录结构

```text
app/appfactory/                 AppFactory 页面、布局、任务中心
app/api/appfactory/v1/          项目、Pi 会话、预览与发布 API
app_factory/server/publication/ 持久任务、Release 构建、运行时恢复
app_factory/contracts/          app.yaml 校验
features/apps/                  应用中心查询、排序与注册数据模型
scripts/app.ts                  平台与发布 Worker 统一启动器
```

## 功能与代码地图

### AppFactory 开发工作区

- 页面：`app/appfactory/page.tsx`、`app/appfactory/projects/[id]/page.tsx`。
- 对话与文件：`app/appfactory/_components/workspace-panels.tsx`、`app_factory/server/pi-run.ts`。
- 数据：`app_factory/server/database.ts` 保存项目、Workspace、Pi Session、transcript 与 runs。
- 当前状态：项目可创建、预览、以 Pi 修改 Workspace，并恢复会话历史。

### 一键发布与任务中心

- 页面与共享状态：`app/appfactory/_components/publication-task-center.tsx`，由 `app/appfactory/layout.tsx` 提供全局任务中心。
- API：`projects/[id]/publication` 创建任务；`publication-jobs/**` 提供查询、SSE、取消与重试。
- 编排：`app_factory/server/publication/worker.ts`。
- 构建与运行：`release-builder.ts` 构建 immutable standalone Release；`runtime.ts` 在固定端口启动、健康检查并于 Worker 重启时恢复。
- 当前状态：单一“发布”动作完整执行 `校验 → lint/typecheck/build → 打包 → 启动 → 健康检查 → 应用中心注册`。旧的 Build、Deploy、Register 和通用 Job 机制已移除。

### 应用中心

- 页面：`components/apps/apps-page-client.tsx`。
- 服务：`features/apps/server.ts`；AppFactory producer 永远在应用列表和分组首位。
- 当前状态：分组顺序为 `AppFactory → 原生 → Dify → n8n`。AppFactory 卡片仅由发布 Worker 通过 AgentHub API 注册。

## 关键限制

- AppFactory 是单机演示运行时：发布端口从 4100 起分配，不具备多主机调度、认证或公网反向代理能力。
- `app.yaml` 的 `healthPath` 必须是站内路径，并与 capability bindings 一同参与发布校验。
- Workspace 文件访问限制在项目根目录；transcript 只从 `storage/appfactory/transcripts` 读取。
- 发布取消会终止构建进程组；Release 切换失败时会停止新实例并恢复上一个健康 Release。
