# AI Platform 开发状态

## 项目概况

AI Platform 是单机演示系统。`/workbench` 为 AgentHub 工作台，`/appfactory` 用于以 Pi Harness 协作开发 Next.js 应用，并将可运行的 Release 自动发布到 `/apps` 应用中心；应用中心也可接入、启动和停止本机外部 Web 应用。

## 技术与运行

- 技术栈：Next.js 16 App Router、TypeScript、SQLite、Pi Harness、Next.js standalone runtime。
- 启动：`npm run dev` 同时启动平台与 AppFactory 发布 Worker；发布不使用 Docker。
- 模块：项目以 ESM 模式运行，Node 直接加载 TypeScript 启动脚本时不会重复解析模块格式。
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
scripts/app.mts                 平台与发布 Worker 统一启动器
```

## 功能与代码地图

### AppFactory 开发工作区

- 页面：`app/appfactory/page.tsx`、`app/appfactory/projects/[id]/page.tsx`、`app/appfactory/settings/page.tsx`。
- 对话与文件：`app/appfactory/projects/[id]/page.tsx`、`app/appfactory/_components/workspace-panels.tsx`、`app_factory/server/pi-run.ts`。`POST sessions/[id]/run` 只创建并启动 Run，`GET sessions/[id]/run` 查询活动任务，`GET runs/[id]/events` 以 SSE 回放并订阅带序号的 transcript；项目页首次进入或重新进入时均可恢复正在执行的任务与实时过程。
- 项目模板与运行时：`app_factory/template-catalog.ts` 是唯一的项目模板注册入口；每个模板在 `app_factory/templates/` 中同时保存初始 Workspace、Pi 开发说明和按需 reference。`app_factory/runtimes/` 负责模板对应的 Preview、构建和 Release 启动，当前支持 Next.js 与纯 HTML 静态站点。Pi 完成后会以原端口重建已开启的 Preview，使原预览页刷新后显示最新源码；全局仅保留一个 Preview，30 分钟未重新请求预览时自动回收。Pi 可以继续在真实 Workspace 使用 Bash；Pi 运行期间不能 Preview/发布，发布排队或运行期间不能开始 Pi，避免读写同一份源码。
- 模型配置：`app_factory/server/model-profiles.ts` 定义稳定档案 `zhipu` 与 `deepseek`，实际模型名由 `APPFACTORY_ZHIPU_MODEL`、`APPFACTORY_DEEPSEEK_MODEL` 必填配置；`pi-agent-config.ts` 注册智谱 PaaS Provider；`settings/model` 接口保存默认档案与思考程度。
- 数据：`app_factory/server/database.ts` 保存项目、Workspace、Pi Session、transcript、runs 和单行模型设置。
- 当前状态：项目可创建、预览、以 Pi 修改 Workspace，并恢复会话历史及进行中的 Run。默认档案为 `zhipu`；默认档案只应用于新建对话，对话创建后固定档案，实际模型名每次执行从环境变量读取，`low / high / max` 思考程度为全局设置并在下一次执行生效。模型请求失败会将运行与会话标记为失败，不会误报完成。

### 一键发布与任务中心

- 页面与共享状态：`app/appfactory/_components/publication-task-center.tsx`，由 `app/appfactory/layout.tsx` 提供全局任务中心。
- API：`projects/[id]/publication` 创建任务；`publication-jobs/**` 提供查询、SSE、取消与重试。
- 编排：`app_factory/server/publication/worker.ts`。
- 构建与运行：每个运行时负责构建 immutable Release；`runtime.ts` 在固定端口启动、健康检查并于 Worker 重启时恢复。Release 持久保存运行时 ID，确保重启后仍按原技术栈启动。
- 当前状态：单一“发布”动作完整执行 `校验 → lint/typecheck/build → 打包 → 启动 → 健康检查 → 应用中心注册`。旧的 Build、Deploy、Register 和通用 Job 机制已移除。

### 应用中心

- 页面与组件：`components/apps/apps-page-client.tsx`，`components/apps/external-app-form.tsx`，`components/apps/app-action-drawer.tsx`。
- 服务与数据：`features/apps/server.ts`、`features/apps/external-app-seed.ts`、`features/apps/external-launcher.ts`；应用记录保存在 `storage/agenthub/agenthub.db`。
- 接口：`/api/agenthub/v1/applications` 继续接收 AppFactory 的发布注册；外部应用的编辑、移除、启动和停止分别使用 `applications/[id]`、`applications/[id]/start`、`applications/[id]/stop`。
- 当前状态：分组顺序固定为 `AppFactory → 外部应用 → Dify → n8n`。AppFactory 卡片只由发布 Worker 注册，点击后直接在新页签打开已发布应用；外部应用保留操作抽屉。所有应用卡片都提供删除入口。
- 删除与运行边界：所有删除操作都会物理删除应用注册；删除外部应用前会停止平台记录的进程组，删除 AppFactory 应用前会停止运行时并标记部署已停止，但保留项目、源码与 Release 历史，之后可再次发布。预置应用仅在数据库首次初始化时写入，之后的删除不会被重新插入。外部应用以 `starting / running / null` 记录平台托管状态；`scripts/app.mts` 在 Ctrl+C、SIGTERM 或主子进程异常退出时回收所有平台记录的外部进程组，并在平台启动时清理异常退出遗留的进程。平台不会停止已经由其他方式运行的服务。

## 关键限制

- AppFactory 是单机演示运行时：发布端口从 4100 起分配，不具备多主机调度、认证或公网反向代理能力。
- Pi Run 与浏览器连接解耦，离开项目页面不会停止任务；但执行仍由当前平台 Node 进程托管，平台重启或崩溃时不具备独立 Worker 级的任务续跑能力。
- `app.yaml` 的 `healthPath` 必须是站内路径，并与 capability bindings 一同参与发布校验。
- Workspace 文件访问限制在项目根目录；transcript 只从 `storage/appfactory/transcripts` 读取。
- 发布取消会终止构建进程组；Release 切换失败时会停止新实例并恢复上一个健康 Release。
- AppFactory 模型使用 `APPFACTORY_ZHIPU_API_KEY`、`APPFACTORY_ZHIPU_MODEL`、`APPFACTORY_DEEPSEEK_API_KEY` 和 `APPFACTORY_DEEPSEEK_MODEL`；不得复用 Workbench 的 `DEEPSEEK_*` 或旧 `APPFACTORY_PI_*` 配置。
