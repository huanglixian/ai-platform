# AI Platform 开发状态

## 项目概况

AI Platform 是单机演示系统。`/workbench` 为 AgentHub 工作台，`/appfactory` 用于以 Pi Harness 协作开发 Next.js 应用，并将可运行的 Release 自动发布到 `/apps` 应用中心；应用中心也可接入、启动和停止本机外部 Web 应用。

## 技术与运行

- 技术栈：Next.js 16 App Router、TypeScript、SQLite、Pi Harness、Next.js standalone runtime。
- 启动：`npm run dev` 同时启动平台与 AppFactory 发布 Worker；发布不使用 Docker。
- 环境：`.env.local` 必须设置 `AGENT_HUB_BASE_URL`，单机默认是 `http://localhost:19844`。
- 数据：AppFactory 的项目、会话、任务与 Release 在 `storage/appfactory`；应用中心数据在 `storage/agenthub/agenthub.db`。
- Pi 会话会保留模型与应用所需环境变量，但会移除平台自身的 Node 启动参数，确保 Workspace 不会错误加载平台脚本。

## 目录结构

```text
app/appfactory/                 AppFactory 页面、布局、任务中心
app/api/appfactory/v1/          项目、Pi 会话、预览与发布 API
app_factory/server/publication/ 持久任务、Release 构建、运行时恢复
app_factory/contracts/          app.yaml 校验
features/apps/                  应用中心数据、外部应用种子与本机启动器
components/apps/                应用中心列表、接入表单与应用操作抽屉
scripts/app.ts                  平台与发布 Worker 统一启动器
```

## 功能与代码地图

### AppFactory 开发工作区

- 页面：`app/appfactory/page.tsx`、`app/appfactory/projects/[id]/page.tsx`。
- 对话与文件：`app/appfactory/_components/workspace-panels.tsx`、`app_factory/server/pi-run.ts`。
- 预览：`app_factory/server/preview.ts` 直接以 Workspace 本地 Next CLI 启动开发服务器，并隔离平台的 Node 启动参数。
- 数据：`app_factory/server/database.ts` 保存项目、Workspace、Pi Session、transcript 与 runs。
- 当前状态：项目可创建、预览、以 Pi 修改 Workspace，并恢复会话历史。

### 一键发布与任务中心

- 页面与共享状态：`app/appfactory/_components/publication-task-center.tsx`，由 `app/appfactory/layout.tsx` 提供全局任务中心。
- API：`projects/[id]/publication` 创建任务；`publication-jobs/**` 提供查询、SSE、取消与重试。
- 编排：`app_factory/server/publication/worker.ts`。
- 构建与运行：`release-builder.ts` 构建 immutable standalone Release；`runtime.ts` 在固定端口启动、健康检查并于 Worker 重启时恢复。
- 当前状态：单一“发布”动作完整执行 `校验 → lint/typecheck/build → 打包 → 启动 → 健康检查 → 应用中心注册`。旧的 Build、Deploy、Register 和通用 Job 机制已移除。

### 应用中心

- 页面与组件：`components/apps/apps-page-client.tsx`，`components/apps/external-app-form.tsx`，`components/apps/app-action-drawer.tsx`。
- 服务与数据：`features/apps/server.ts`、`features/apps/external-app-seed.ts`、`features/apps/external-launcher.ts`；应用记录保存在 `storage/agenthub/agenthub.db`。
- 接口：`/api/agenthub/v1/applications` 继续接收 AppFactory 的发布注册；外部应用的编辑、移除、启动和停止分别使用 `applications/[id]`、`applications/[id]/start`、`applications/[id]/stop`。
- 当前状态：分组顺序固定为 `AppFactory → 外部应用 → Dify → n8n`。AppFactory 卡片只由发布 Worker 注册，Dify 与 n8n 为演示数据；外部应用预置桌面快捷启动目录中的 12 个独立演示应用，且可手工接入新的本机应用。
- 运行边界：外部应用使用保存的本机命令启动，不嵌入 iframe；启动完成后由用户通过“打开应用”在新页签访问。平台仅停止自己记录的独立进程组，不会停止已经由其他方式运行的服务。

## 关键限制

- AppFactory 是单机演示运行时：发布端口从 4100 起分配，不具备多主机调度、认证或公网反向代理能力。
- `app.yaml` 的 `healthPath` 必须是站内路径，并与 capability bindings 一同参与发布校验。
- Workspace 文件访问限制在项目根目录；transcript 只从 `storage/appfactory/transcripts` 读取。
- 发布取消会终止构建进程组；Release 切换失败时会停止新实例并恢复上一个健康 Release。
