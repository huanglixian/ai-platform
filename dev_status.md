# 项目开发状态

更新时间：2026-08-29

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
- `/api/appfactory/v1/sessions/[id]/run` 与 `/transcript`：Pi 执行和会话记录恢复。
- `/api/appfactory/v1/projects/[id]/register`：仅允许当前 Release 已通过健康检查并处于运行状态时注册 AgentHub，使用实际 Deployment URL。

## 关键边界

- Workspace 路径必须限制在项目根目录；文件树和列表会隐藏隐藏目录、`node_modules`、`.next`、`out`、`build`、`.turbo`、`.cache` 等生成内容。
- Transcript 只允许读取 `storage/appfactory/transcripts` 下的记录。
- AppFactory 不直接依赖 AgentHub 数据库或业务 Repository；AgentHub 集成通过独立 Client 接口完成。
- Preview 使用独立窗口打开，开发工作区不嵌入第三栏预览。

## 已验证

- Pi + DeepSeek 真实自然语言请求可完成文件修改，刷新项目后可恢复 transcript。
- Build 子进程使用生产环境，Deployment 健康检查通过后，AgentHub 注册记录使用真实运行地址。
- 桌面、平板和移动端已通过 Chrome 视觉验收；移动端提供“对话 / 文件”切换，点击文件进入单文件查看器，关闭后返回对话。
- 项目文件列表已从生成目录噪声收敛为源文件与配置文件。
- Node 核心测试、lint、typecheck、生产 build 和 `git diff --check` 已通过（最终提交前再次执行）。

## 已知限制

- Pi 请求当前以同步 HTTP 完成后集中返回事件；实时 SSE/流式增量事件留作后续阶段。
- 模板中心和全局任务中心尚未开放；当前优先使用项目内的默认起点与活动日志，待出现真实模板和异步任务需求后再增加一级入口。
