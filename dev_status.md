# AI Platform 开发状态

## 项目概况

AI Platform 是单机演示系统。`/` 是统一首页：初始态在上方提供 AI 助手输入区、下方按来源展示应用；发送消息后切换为沉浸式沟通界面。`/appfactory` 用于以 Pi Harness 协作开发 Next.js 应用，并将可运行的 Release 自动加入首页应用目录；应用目录也可接入、启动和停止本机外部 Web 应用。

## 技术与运行

- 技术栈：Next.js 16 App Router、TypeScript、SQLite、Pi Harness、Next.js standalone runtime。
- 启动：`npm run dev` 同时启动平台与 AppFactory 发布 Worker；发布不使用 Docker。
- 模块：项目以 ESM 模式运行，Node 直接加载 TypeScript 启动脚本时不会重复解析模块格式。
- 环境：`.env.local` 必须设置 `AGENT_HUB_BASE_URL`，单机默认是 `http://localhost:19844`。
- 数据：`data/settings` 是 Git 跟踪的平台配置；`data/builtin` 是 Git 跟踪的内置资源；`data/storage` 是本机运行数据。AppFactory 的项目、会话、任务与 Release 在 `data/storage/appfactory`；应用中心数据在 `data/storage/agenthub/agenthub.db`。启动器会将旧运行数据迁入新位置；若迁移期间已生成空的新应用中心或 KnowHub 目录，会合并旧应用中心记录或以旧 KnowHub 数据恢复该空目录，旧副本归档至 `data/storage/recovery`。
- Pi 会话会保留模型与应用所需环境变量，但会移除平台自身的 Node 启动参数，确保 Workspace 不会错误加载平台脚本。

## 目录结构

```text
app/(platform)/page.tsx         统一首页路由
app/appfactory/                 AppFactory 页面、布局、任务中心
app/api/appfactory/v1/          项目、Pi 会话、预览与发布 API
app/api/platform/assistant/     AI 助手 API
app_factory/server/publication/ 持久任务、Release 构建、运行时恢复
app_factory/contracts/          app.yaml 校验
features/platform-home/         首页组合与展示状态
features/assistant/             AI 助手客户端、会话 UI 与服务端编排
features/apps/                  应用目录数据、运行时与分组 UI
data/builtin/                   随 Git 发布的内置技能资源
data/settings/                  随 Git 管理的平台设置
data/storage/                   本机数据库、工作区与知识库运行数据（忽略）
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
- 构建与运行：每个运行时负责构建 immutable Release；首次发布会从 4100 起分配并为项目保留端口，`runtime.ts` 在该固定端口启动、健康检查并于 Worker 重启时恢复。Release 持久保存运行时 ID，确保重启后仍按原技术栈启动。
- 当前状态：单一“发布”动作完整执行 `校验 → lint/typecheck/build → 打包 → 启动 → 健康检查 → 应用中心注册`。旧的 Build、Deploy、Register 和通用 Job 机制已移除。

### 统一首页、AI 助手与应用目录

- 页面与组合状态：`app/(platform)/page.tsx`、`features/platform-home/platform-home-page.tsx`。首页仅负责在初始态展示助手输入区和应用分组；对话激活后只显示助手沟通界面。
- 助手：客户端与 UI 在 `features/assistant/`，提供问答与已发布知识库搜索；问答接口为 `/api/platform/assistant/chat`，知识库搜索复用 KnowHub 检索接口。问答先在应用、已启用技能和可用业务 API 中分流：明确任务执行技能，相关但不足以执行的请求返回推荐卡片，无明显匹配时显示可配置的引导文案及首页、技能中心、业务 API 跳转入口；通用工具不参与推荐。技能执行时只挂载其声明且已注册实现的工具。
- 应用目录 UI：`features/apps/ui/application-catalog.tsx`。支持来源筛选与关键词搜索，按 `AppFactory → 外部应用 → Dify / n8n` 展示；接入入口仅位于外部应用、Dify、n8n 的分组标题中。
- 当前状态：助手消息和搜索结果仅保存在浏览器内存中；无匹配引导文案保存在 Git 跟踪的 `data/settings/assistant.json`，可在“配置管理 → AI 助手”编辑；点击“返回首页”会结束当前问答或搜索并恢复应用目录。

### 应用注册与运行

- 服务与数据：`features/apps/server.ts`、`features/apps/external-app-seed.ts`、`features/apps/external-launcher.ts`；应用记录保存在 `data/storage/agenthub/agenthub.db`。
- 接口：`/api/agenthub/v1/applications` 继续接收 AppFactory 的发布注册；所有来源的注册信息编辑与移除使用 `applications/[id]`，外部应用启动和停止使用 `applications/[id]/start`、`applications/[id]/stop`。
- 当前状态：首页不使用应用详情抽屉。所有卡片都可直接编辑和删除；AppFactory、Dify 与 n8n 卡片点击后直接在新页签打开，外部应用未启动时卡片本体不可点击，启动后可点击直达，并在卡片上直接启动或停止。AppFactory 的运行地址由发布流程维护，首页编辑只修改名称和说明。外部应用、Dify 与 n8n 可从各自分组接入。
- 删除与运行边界：所有删除操作都会物理删除应用注册；删除外部应用前会停止平台记录的进程组，删除 AppFactory 应用前会停止运行时并标记部署已停止，但保留项目、源码与 Release 历史，之后可再次发布。预置应用仅在数据库首次初始化时写入，之后的删除不会被重新插入。外部应用以 `starting / running / null` 记录平台托管状态；启动器会剥离平台自身的 `PORT` 与 Node 运行参数，让外部应用自行采用启动命令、`.env` 或代码中的端口配置。`scripts/app.mts` 在 Ctrl+C、SIGTERM 或主子进程异常退出时回收所有平台记录的外部进程组，并在平台启动时清理异常退出遗留的进程。平台不会停止已经由其他方式运行的服务。

## 关键限制

- AppFactory 是单机演示运行时：发布端口从 4100 起分配，不具备多主机调度、认证或公网反向代理能力。
- Pi Run 与浏览器连接解耦，离开项目页面不会停止任务；但执行仍由当前平台 Node 进程托管，平台重启或崩溃时不具备独立 Worker 级的任务续跑能力。
- `app.yaml` 的 `healthPath` 必须是站内路径，并与 capability bindings 一同参与发布校验。
- Workspace 文件访问限制在项目根目录；transcript 只从 `data/storage/appfactory/transcripts` 读取。
- 内置技能位于 `data/builtin/skills`；首次使用技能时仅复制一次到 `data/storage/agenthub/skills`，之后运行目录才是有效技能集，用户对技能的删除或修改不会被内置资源覆盖。
- 发布取消会终止构建进程组；Release 切换失败时会停止新实例并恢复上一个健康 Release。
- AppFactory 模型使用 `APPFACTORY_ZHIPU_API_KEY`、`APPFACTORY_ZHIPU_MODEL`、`APPFACTORY_DEEPSEEK_API_KEY` 和 `APPFACTORY_DEEPSEEK_MODEL`；不得复用平台 AI 助手的 `DEEPSEEK_*` 或旧 `APPFACTORY_PI_*` 配置。
