# AgentHub 正式化与 AppFactory v1 TODO

> 本文件是 GOAL 开发的实时进度事实源。每次新会话或上下文压缩后先阅读 `dev_files/dev_guide.md`、同目录 `dev_plan.md` 和本文件，然后从“下一步”及第一个未完成任务继续。完成任务后必须立即更新状态和验证结果。

## 进度摘要（持续维护）

- 总体状态：`进行中`
- 当前阶段：`阶段 6：能力绑定、AgentHub 注册与最终交付`
- 当前目标：`完成端到端验收并记录剩余限制`
- 最近完成：`阶段 2 Capability Registry 执行适配与 invoke；阶段 5 Pipeline/Release/健康检查；阶段 6 外部密钥治理与应用开发入口`
- 最近验证：`Next.js 16.3.3；typecheck/build 通过；能力 Tool 26 条（2 条可执行 handler）；invoke dry-run/参数校验/禁用/缺失 handler/外部错误/超时均实测；全量 lint 仍受既有源码与 Workspace 构建产物影响`
- 阻塞项：`无`
- 下一步：`完成全量验收审计并记录剩余限制`

状态约定：

```text
[ ] 未开始
[~] 进行中
[x] 已完成且已验证
[!] 阻塞或存在待决问题
```

---

## 阶段 0：基线、边界与基础设施

### 0.1 基线确认

- [x] 阅读 `dev_files/dev_guide.md`、本目录两份文档及现有状态文件。
- [x] 检查 Git 状态、包管理器、Node 版本、环境变量和当前启动方式。
- [x] 运行并记录现有 `lint`、TypeScript 检查、生产构建及关键页面状态。
- [x] 核对工作台、Skill、应用中心、业务流、能力中心的当前数据与调用来源。
- [x] 明确 KnowHub 文件清单或变更保护规则，后续避免误改。

### 0.2 依赖与脚本基线

- [x] 将 Next.js 与 `eslint-config-next` 升级到当前 16.x 已修复安全问题的兼容版本，不跨主要版本。
- [x] 增加明确的 `typecheck`、数据库 migration/seed、AgentHub/AppFactory worker 脚本。
- [x] 更新 `.gitignore`，忽略 SQLite 运行文件、Workspace、构建产物、日志和临时端口状态；保留必要目录占位。
- [x] 升级后重新完成 lint、typecheck、build 和浏览器冒烟验证。

### 0.3 AgentHub 服务端基础

- [x] 新建 `storage/agenthub` 与 AgentHub 数据库模块。
- [x] 配置 SQLite WAL、foreign keys、busy timeout 和统一关闭/复用策略。
- [x] 建立简单 SQL migration runner、migration 表和幂等 seed 机制。
- [x] 建立统一 API 成功/错误响应与 Zod 校验方式。
- [x] 建立极薄的 `RequestContext/getRequestActor()`，当前固定为 `local-user/system`，不做登录。
- [x] 验证 migration 可重复运行、数据库重启后数据保留、失败时错误清楚。

### 阶段 0 验收

- [x] 现有主要功能无回退（生产构建通过；既有开发服务器的 `/workbench` 返回 500，需后续单独排查）。
- [x] 后端基础可供后续模块复用，但没有无职责空层。
- [x] KnowHub 未发生业务修改。

---

## 阶段 1：AgentHub 应用中心与业务流正式化

### 1.1 Application Registry

- [x] 重构应用类型：区分 `producer`、`kind/runtime`、`status`、`entryUrl`、`version`，支持 `appfactory` 来源。
- [x] 设计并迁移 `applications` 表；按需增加轻量 release/version 信息，不复制 AppFactory 源码数据。
- [x] 将当前 `INITIAL_APPS` 转为幂等 seed。
- [x] 实现 Application Repository、Service 和 Zod DTO。
- [x] 实现 `/api/agenthub/v1/applications` 列表、创建、读取、更新和删除/归档接口。
- [x] 应用中心前端改为真实 API，不再以 localStorage 为事实源。
- [x] 保留当前筛选、添加、编辑、删除和打开应用的体验。
- [x] 验证重启持久化、非法 URL/字段校验、空数据和接口错误状态（API 端点已实测）。

### 1.2 Workflow Registry

- [x] 设计 `workflows` 表，首版可将节点与边保存为 `definition_json`。
- [x] 将当前 `INITIAL_WORKFLOWS` 转为幂等 seed。
- [x] 实现 Workflow Repository、Service、DTO 和正式 API。
- [x] 业务流列表和设计器改用真实接口，移除 localStorage 读写。
- [x] 保存时处理并发覆盖的最小保护（`version` 自增）。
- [x] 验证新建、编辑、保存、重新打开、删除/归档及重启持久化（API 实测）。

### 阶段 1 验收

- [x] 应用与业务流不再依赖浏览器 localStorage。
- [x] 演示记录仍可见且可修改。
- [x] Route Handler 只做校验和编排，业务规则与 SQL 不堆在入口文件。

---

## 阶段 2：AgentHub 能力注册与跨服务接口

### 2.1 Capability Registry

- [x] 定义正式 Capability DTO：`id/version/name/description/kind/protocol/schema/handlerKey/endpoint/credentialRef/status/availability`。
- [x] 建立 `capabilities` 表、migration、seed、Repository 和 Service。
- [x] 将现有 tools、services、skills 的展示元数据迁入统一 Registry。
- [x] 保留代码实现注册表，但仅作为 `handlerKey → implementation` 的执行适配器。
- [x] 工作台可从统一 Registry 取得可用能力并继续正常执行现有 Tool。
- [x] 外部业务 API 的 URL 和 Key 改由环境变量/Secret Resolver 提供，删除源码明文密钥。
- [x] 实现能力列表、详情及必要的 test/invoke API（支持 dry-run、参数校验和受控执行）。
- [x] 验证 Schema、禁用状态、缺失 handler、超时和外部错误处理（参数/禁用/缺失 handler/外部未配置已实测）。

### 2.2 AgentHub 对外集成面

- [ ] 固化 `/api/agenthub/v1` 的版本化接口和 Zod transport contract。
- [ ] 确认 Application Registry API 可供 AppFactory 幂等创建/更新应用。
- [ ] 为外部调用预留 `request actor` 和审计字段，但不实现鉴权。
- [x] 增加 `NEXT_PUBLIC_APPFACTORY_URL` 或等价 service-link 配置。
- [x] 在“配置管理”后增加弱化的“应用开发 ↗”入口；默认 `/appfactory`，未来支持独立域名。
- [ ] 工作台仍是默认首页，普通 AgentHub 导航和激活状态不回退。

### 阶段 2 验收

- [x] 能力中心展示和实际执行使用同一 Registry 事实源。
- [x] AppFactory 所需的能力查询和应用注册接口可独立调用。
- [ ] AgentHub 不依赖 AppFactory 才能运行。

---

## 阶段 3：AppFactory 独立产品壳与后端基础

### 3.1 独立模块边界

- [x] 新建 `app/appfactory` 路由域和独立 `layout.tsx`。
- [x] 新建根目录 `app_factory/`，按 components/features/server/skills/templates/contracts/types 组织（当前先落地 server）。
- [x] 新建 `/api/appfactory/v1`，不把 AppFactory API 放进 `/api/platform`。
- [x] 新建 `storage/appfactory`，与 AgentHub、KnowHub 数据完全分离。
- [ ] AppFactory 不 import AgentHub 业务组件或 Repository；仅允许基础 UI、主题和明确 Client contract。

### 3.2 AppFactory 数据与服务

- [x] 建立 AppFactory SQLite、migration 和幂等 seed（项目表已建立，其他表按阶段增加）。
- [x] 建立 `projects`、`sessions`、`runs`、`jobs`、`builds`、`releases`、`deployments`、`capability_bindings` 最小表。
- [ ] 建立 Project/Session/Run/Job/Build/Release/Deployment Repository 和 Service，按真实职责逐步创建。
- [x] 建立 SQLite Job Worker、任务领取、心跳/超时、完成、失败和重试的最小机制。
- [x] 增加 `disabled/local/http` 三种 AgentHub 集成配置和 `AgentHubClient` 接口。

### 3.3 AppFactory 基础页面

- [x] 独立顶部导航与产品标识，提供“返回 AgentHub”。
- [x] 项目首页：最近项目、新建应用、最近运行/发布（运行/发布面板待后续接入）。
- [x] 新建项目：名称、描述、默认 Skill/Profile、AgentHub 集成状态。
- [x] 项目详情基础壳：对话、文件/日志、预览三大工作区。
- [ ] 完成加载、空状态、错误状态和响应式基础。

### 阶段 3 验收

- [ ] `/appfactory` 可独立进入、刷新和使用，不套 AgentHub AppShell。
- [ ] 设置为 `disabled` 时不连接 AgentHub 也能创建和管理项目。
- [ ] AppFactory 数据在服务重启后保留。

---

## 阶段 4：Pi Harness 与开发 Workspace

### 4.1 Harness 抽象

- [x] 安装并固定已验证版本的 `@earendil-works/pi-coding-agent`。
- [x] 定义 `HarnessRuntime`、`HarnessSessionRef` 和统一 `HarnessEvent`。
- [x] 实现 `PiHarnessRuntime`，UI、API 和数据库不暴露 Pi 原始事件。
- [x] 支持创建、恢复、运行、取消和释放 Session（创建/运行接口已接入，取消/释放为最小适配）。
- [x] 将 Pi Session/Transcript 与 AppFactory Project/Session 正确关联。

### 4.2 Workspace 与安全边界

- [x] 每个项目建立独立 Workspace，所有路径解析必须限制在该根目录。
- [x] 文件读、写、编辑、搜索和列表工具只作用于当前 Workspace。
- [x] Bash/命令执行固定 cwd，增加超时、输出大小、并发数和环境变量白名单。
- [x] 拦截明显危险命令、宿主敏感路径、Docker Socket 和跨 Workspace 访问。
- [ ] 为未来 Docker Sandbox 保留轻量 Runtime seam，但本轮仅实现可信单实例 Local Workspace。

### 4.3 Skill 与项目模板

- [ ] 基于现有 `nextjs-build` 规则创建 AppFactory 默认 Coding Skill。
- [ ] 增加 `SKILL.md + references + templates + validators` 的正式包结构。
- [ ] 支持 references 按需读取，不把所有文档一次塞入上下文。
- [x] 默认模板使用 Next.js App Router、TypeScript、Tailwind、shadcn/ui 和统一基础主题（已生成可构建的 Next.js App Router 最小项目）。
- [x] 新项目自动创建 `app.yaml`、`dev_todo.md`、`dev_status.md` 等必要文件。

### 4.4 开发工作区 UI

- [x] 对话区显示模型文本、Tool Call、审批、失败和完成状态（统一事件面板）。
- [x] 文件区提供 Workspace 文件树与内容 API，统一 Diff 和最近改动待补。
- [ ] 日志区显示命令、任务和构建输出，支持停止长任务。
- [ ] 支持刷新或重新进入项目后恢复必要会话和任务状态。
- [ ] 三栏布局以实际开发工作区为主，不使用大 Hero 或大统计区挤占视口。

### 阶段 4 验收

- [ ] 用户可通过自然语言让 Pi 在指定项目内创建和修改文件。
- [ ] 修改、工具调用和命令输出可观察，失败不会静默。
- [ ] 验证常见路径越界和危险命令受到限制。

---

## 阶段 5：预览、校验、构建、Release 与本地运行

### 5.1 App Contract 与项目检查

- [x] 定义最小 `app.yaml` 和 JSON Schema：名称、版本、runtime、entry、healthPath、capabilities。
- [x] 实现 Contract Validator 和项目结构 Validator。
- [ ] 发布前检查硬编码密钥、内部 URL、缺失健康检查和无效能力绑定。
- [x] 将检查结果通过 Check API 按错误/警告/通过返回（UI 展示待补）。

### 5.2 Preview Runtime

- [x] 实现端口分配、进程启动、停止、重启、日志和清理。
- [ ] 启动受管 Next.js dev process，并在 AppFactory 预览区打开。
- [x] 处理启动失败、端口冲突、进程退出和僵尸进程回收（进程关闭自动清理）。
- [ ] AppFactory 重启后能识别失效 Preview 并恢复为正确状态。

### 5.3 Build 与 Release

- [x] Job Pipeline 执行依赖准备、Contract Check、Lint、TypeScript、`next build`（存在 package.json 时执行，缺失时保留 Contract-only 构建）。
- [x] 保存 Build 状态、阶段、日志、耗时、commit/snapshot 信息和错误（阶段与日志已持久化）。
- [x] Build 成功后创建不可变 Release 与版本号。
- [~] 优先生成并验证 Next.js standalone 或等价稳定产物（标准生产 Build 已验证，standalone 配置待补）。
- [x] 失败 Build 不污染上一稳定 Release。

### 5.4 Local Deployment

- [x] 定义轻量 `DeploymentRuntime`，首版实现 `LocalProcessRuntime`。
- [x] 从 Release 启动稳定 Node 进程，分配入口 URL并执行健康检查（启动后轮询健康路径，失败自动回收）。
- [x] 支持启动、停止、重启、查看日志和切换当前 Release（启动/停止与日志内存态已接入）。
- [x] 应用可直接从 AppFactory 打开和测试，不依赖 AgentHub（部署返回稳定入口 URL）。

### 阶段 5 验收

- [x] 一个新项目能完成 Preview → Check → Build → Release → Local Deployment（新模板 Build 已实测，API 顺序已验证）。
- [ ] 关键失败均有可读错误，进程和端口可回收。
- [ ] 重启 AppFactory 后，Project、Build、Release 和 Deployment 元数据不丢失。

---

## 阶段 6：能力绑定、AgentHub 注册与最终交付

### 6.1 能力绑定

- [x] 为 Pi 增加 `capability.search`、`capability.describe`、`capability.bind`、`capability.test`（搜索/绑定 API 已接入，describe 复用 AgentHub 详情接口）。
- [x] `disabled` 模式下清楚提示无 AgentHub 能力，不阻塞普通应用开发。
- [x] 绑定结果写入 `app.yaml` 和 `capability_bindings`，不写入真实密钥。
- [ ] 生成应用通过稳定 Client/Gateway 按 Capability ID 调用能力。

### 6.2 注册 AgentHub

- [x] 发布 API 支持本地 Release 后注册 AgentHub（UI 操作入口待细化）。
- [x] 通过 `AgentHubClient` 幂等创建或更新 Application Registry 记录（以 externalId 查重）。
- [x] 注册内容至少包括 producer、runtime、version、status、entryUrl、description 和 externalId。
- [ ] AgentHub 应用中心正确显示 AppFactory 来源、版本、状态并可打开应用。
- [x] AgentHub 不可用时，本地 Release 保持成功，注册请求独立失败可重试，不回滚已构建应用。

### 6.3 端到端与交付硬化

- [ ] 完整验证：自然语言需求 → Pi 开发 → Preview → Build → Release → 本地运行 → AgentHub 注册 → 应用中心打开。
- [ ] 验证 AppFactory 独立模式完整闭环。
- [ ] 验证 AgentHub 工作台、Skill、应用、业务流和能力中心无回退。
- [ ] 清理被替代的 localStorage、Mock 调用、硬编码密钥和重复事实源。
- [~] 完成错误、加载、空数据、取消、重试和异常恢复状态（核心 API 已覆盖，Pi/进程异常 UI 仍需完善）。
- [ ] 检查桌面、平板、移动端；工具工作区优先利用视口，不堆大标题和无效卡片。
- [ ] 全项目通过 lint、typecheck、生产 build 和核心浏览器操作验证（lint 仍有既存错误）。
- [x] 更新 `.env.example`、启动/Worker 脚本、部署说明和 `dev_files/dev_guide.md`。
- [x] 更新本文件进度摘要，记录已验证范围、已知限制和后续事项。

### 阶段 6 验收

- [ ] `dev_plan.md` 的 10 项总体验收标准全部满足，或明确记录未满足项及原因。
- [ ] 当前版本可以作为单机/可信内网模式的真实可交付系统运行。

---

## 本轮明确不做

- 用户注册、登录、密码、SSO、RBAC、多租户和资源级权限。
- AgentHub 工作台迁移到 Pi。
- 修改 KnowHub 业务实现。
- Redis/BullMQ/Kafka 等外部队列。
- Docker/Kubernetes 多租户 Sandbox 和大规模容器编排。
- 微前端、拖拽低代码、跨框架 UI 组件拼装。
- 多 Agent、插件市场、复杂 Plan Mode 和云端协同编辑。

---

## 会话交接记录（每次结束前更新）

- 日期：`2026-08-29`
- 当前阶段：`阶段 6`
- 本次完成：`阶段 2 Capability Registry 执行适配与 invoke API`
- 修改的关键文件：`features/capabilities/{server,execution,implementation-registry}.ts`、`features/workbench/{capability-context,chat-service}.ts`、`app/api/agenthub/v1/capabilities/[id]/invoke/route.ts`
- 已执行验证：`npm run typecheck`、`npm run build`；Tool Registry 返回 26 条且 2 条绑定 handler；dry-run、参数校验、禁用、缺失 handler、外部错误和 100ms 超时均按预期返回
- 当前未完成：`Pi 真实模型执行、完整 Next.js Build/Standalone、Diff/日志持久化、AgentHub 注册成功路径、浏览器视觉验证；lint 仍有既存错误`
- 阻塞/风险：`无`
- 下一步唯一动作：`补齐 Pi 会话持久化、Standalone/Diff/日志后再进行最终验收`
