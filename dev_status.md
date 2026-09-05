# 项目开发状态

更新时间：2026-09-05

## 当前状态

- AgentHub 继续作为 `/workbench` 首页；KnowHub 本轮未修改业务实现。
- AppFactory 已形成独立产品壳，数据使用 `storage/appfactory`，通过 AgentHub Client/Gateway 做可选集成。
- AppFactory 第一版使用 Pi Harness；运行时状态、模型、Harness 和 Coding Skill 状态已在导航、项目页和设置页可见。

## 主要入口

- 项目中心：`app/appfactory/page.tsx`
- 开发工作区：`app/appfactory/projects/[id]/page.tsx`
- 设置页：`app/appfactory/settings/page.tsx`
- 产品布局：`app/appfactory/layout.tsx`
- 工作区面板：`app/appfactory/_components/workspace-panels.tsx`
- 项目文件树工具：`app/appfactory/_lib/project-ui.ts`

## AppFactory API

- `/api/appfactory/v1/projects`：项目列表和创建。
- `/api/appfactory/v1/projects/[id]`：项目详情、文件、状态、Preview、Check、Build、Deploy 等操作。
- `/api/appfactory/v1/runtime/status`：返回 AI Provider/模型、Pi Harness 和默认 Skill 的可用性，不返回密钥。
- `/api/appfactory/v1/projects/[id]/sessions`：项目 Session 列表、新建对话和 Pi 上下文健康状态；`/api/appfactory/v1/sessions/[id]/run` 与 `/transcript`：Pi 执行和会话记录恢复；`/run/stream` 提供同一执行器的 SSE 增量事件。
- `/api/appfactory/v1/projects/[id]/register`：仅允许当前 Release 已通过健康检查并处于运行状态时注册 AgentHub，使用实际 Deployment URL。

## 关键边界

- Workspace 路径必须限制在项目根目录；文件树和列表会隐藏隐藏目录、`node_modules`、`.next`、`out`、`build`、`.turbo`、`.cache` 等生成内容。
- Transcript 只允许读取 `storage/appfactory/transcripts` 下的记录。
- AppFactory 不直接依赖 AgentHub 数据库或业务 Repository；AgentHub 集成通过独立 Client 接口完成。
- Preview 使用独立窗口打开，开发工作区不嵌入第三栏预览。
- Preview API 只有在子应用通过 HTTP 就绪检查后才返回运行地址；端口分配同时检查 IPv4/IPv6 占用，Next.js 热更新后通过全局进程表或 `.next/dev/lock` 恢复已有预览。

## 已验证

- Pi + DeepSeek 真实自然语言请求可完成文件修改，刷新项目后可恢复 transcript。
- 项目工作区支持在文件树上方切换已有对话和新建对话；每个 Session 使用独立的 Pi `--session-id`，首条需求生成会话标题，切换后恢复对应 Transcript；服务端限制同一 Session 同时只有一个运行。
- Pi 发送态已支持即时清空输入、运行计时、停止/失败反馈；真实请求已通过 SSE 增量收到文本、完成事件，并按 `runId/sequence` 持久化。Pi JSONL 工具事件会展示为文件读取/修改、搜索、命令和上下文步骤，同一运行收束在单一运行卡片内，准备调用与最终状态都保留在内部时间线，进行中和展开后的完成列表自动跟随最新步骤；无工具步骤的成功问答不重复显示执行摘要；旧版 Pi 的启动诊断、内部完成标记和孤立遗留结果会在聊天层过滤；AI 回复通过统一 Markdown/GFM 组件渲染。
- Pi 的 `compaction_start/end` 已转换为“正在整理上下文 / 上下文整理完成”执行步骤；Session 列表可识别 Pi 上下文缺失，并在切换时提示历史记录与模型上下文的差异。
- Build 子进程使用生产环境，Deployment 健康检查通过后，AgentHub 注册记录使用真实运行地址。
- 项目 `project-a8023e2f-4a5f-4862-97de-71228c0bdf27` 已实测恢复遗留 Preview、停止后重新启动，并在 API 返回后立即访问预览首页得到 HTTP 200。
- 桌面、平板和移动端已通过 Chrome 视觉验收；移动端提供“对话 / 文件”切换，点击文件进入单文件查看器，关闭后返回对话。
- 项目文件列表已从生成目录噪声收敛为源文件与配置文件。
- Node 核心测试、lint、typecheck、生产 build 和 `git diff --check` 已通过（最终提交前再次执行）。

## 已知限制

- Pi SSE 当前由 AppFactory Node Route Handler 直接承载，任务执行仍是单机同步进程；断开连接后服务端继续落 transcript，SQLite Job Worker 化与跨项目任务中心留作后续阶段。
- 模板中心和全局任务中心尚未开放；当前优先使用项目内的默认起点与活动日志，待出现真实模板和异步任务需求后再增加一级入口。
