# AgentHub 正式化与 AppFactory v1 开发介绍

> 本文保存本轮 GOAL 的长期背景、边界和阶段。每次新会话或上下文压缩后，先读根目录 `dev_status.md`，再读本文和同目录 `todo-list.md`；实时进度以 `todo-list.md` 为准。

## 0. 项目概览与改造动因

当前 AgentHub 已经能够聚合智能体、Skill、Tool、业务服务、业务流和应用，但整体仍偏向“能力展示与调用平台”。随着 AI Coding 能力快速提升，企业内部会越来越容易快速开发大量小型业务应用，但纯 AI Coding 也容易产生新的问题：

* 每个应用独立开发、独立部署，逐渐形成新的“小烟囱”；
* 技术栈、代码结构、运行方式和质量标准不统一；
* 已有业务系统的能力难以被新应用直接复用；
* 应用开发完成后缺少统一登记、访问、版本和运行治理；
* 传统低代码平台虽然能统一这些问题，却需要开发者适应平台自身的组件体系和开发限制。

因此，本轮新增 **AppFactory**，目标不是再建设一个低代码平台，而是在保留 AI Coding 灵活性的同时，为企业提供一套受控、规范、可治理的 AI 应用开发方式。

整体思路是：

```text
已有异构系统 / Agent / Tool / API / Workflow / KnowHub
                        ↓
              注册为企业可复用能力
                        ↓
                 AgentHub 能力中心
                        ↓
                 AppFactory 调用
                        ↓
        AI Coding 按统一 Skill / Contract 开发
                        ↓
        Preview → Build → Release → Deployment
                        ↓
              注册回 AgentHub 应用中心
```

改造完成后，整个平台形成三个相互独立又可以协作的产品：

```text
AgentHub
企业智能体、能力、业务流和应用的统一入口与治理中心

KnowHub
企业知识接入、处理、检索和运维平台

AppFactory
基于受控 AI Coding 的企业应用开发平台
```

其中 **AgentHub 是企业能力与应用的治理枢纽，AppFactory 是应用生产工具，KnowHub 是知识能力提供方**。

AppFactory 可以消费 AgentHub 中已经注册的企业能力，也可以独立开发普通应用；开发完成的应用可以只在 AppFactory 内测试和运行，也可以注册回 AgentHub，成为统一应用中心中的正式应用。

因此，本轮改造实际上包含两件事：

1. **将现有 AgentHub 从演示型平台进一步正式化**，补齐 Application Registry、Capability Registry、Workflow Registry 和服务端持久化；
2. **新增可独立拆分的 AppFactory v1**，建立从自然语言需求、AI Coding、能力复用，到构建、运行和应用注册的完整闭环。

最终希望形成的不是“AI Coding + 一个门户”，而是一种企业应用建设的新模式：

> **已有能力可复用，新能力可通过 AI Coding 快速开发；开发过程保持自由，开发结果遵循统一规范，并最终进入统一的企业应用治理体系。**

---

## 1. 背景与定位

当前仓库的主体是 **AgentHub**：

* `app/(platform)`、根目录 `components/`、`features/` 属于 AgentHub；`/workbench` 继续作为首页。
* KnowHub 已按独立产品组织，目前仅同仓演示，本轮不得修改其业务代码、接口和存储。
* 本轮新增 **AppFactory（中文：应用开发）**。它暂时同仓，但必须按可独立拆分、部署和运行的正式产品组织。

未来是三套通过正式接口协作的服务：

```text
AgentHub   智能体、能力、业务流和应用的统一入口与治理中心
KnowHub    知识接入、处理、检索和运维平台
AppFactory 基于受控 AI Coding 的企业应用开发平台
```

## 2. 本轮目标

### 2.1 AgentHub 后端正式化

保留现有工作台与 Skill 运行链路，将以下模块从静态数据或浏览器存储迁移到真实服务端、SQLite 和版本化 API：

- 应用中心 → Application Registry
- 业务流 → Workflow Registry
- 能力中心 → Capability Registry

### 2.2 建设正式的 AppFactory v1

形成完整前后端闭环：

```text
项目 → Pi Harness → Skill/Tools → Workspace → Preview
→ Check/Build → Release → 本地运行 → 可选注册 AgentHub
```

AppFactory 不是 AgentHub 工作台中的一个功能页，而是有独立 Layout、API、数据库、Workspace、任务和运行状态的产品。

## 3. 产品职责与发布语义

### AgentHub 负责

- 工作台、Skill、业务流、能力中心和应用中心。
- 登记企业可复用能力，并向 AppFactory 提供查询、详情、测试/调用接口。
- 登记 Dify、n8n、AgentHub 原生、AppFactory 和外部应用。

### AppFactory 负责

- 开发项目、AI Coding 会话、源码 Workspace、构建任务、Preview、Release 和 Deployment。
- 通过 Pi 执行 Agent Loop、Skill 和受控工具调用。
- 在自身平台内预览、测试、构建和本地运行应用。

### “发布到 AgentHub”的含义

```text
AppFactory 构建并部署应用
        ↓
获得稳定 URL 和版本
        ↓
注册到 AgentHub Application Registry
        ↓
从 AgentHub 应用中心访问
```

AgentHub 不保存源码、不运行 Pi、不托管构建进程。未连接 AgentHub 时，AppFactory 仍须独立完成开发、预览、构建和本地发布。

## 4. 代码与存储边界

```text
app/
├─ (platform)/                    # AgentHub，保持现状
├─ knowhub/                       # KnowHub，冻结
├─ appfactory/                    # AppFactory 独立路由域
└─ api/
   ├─ platform/                   # 现有 AgentHub 内部接口，兼容保留
   ├─ agenthub/v1/                # AgentHub 正式跨服务接口
   ├─ knowhub/                    # 冻结
   └─ appfactory/v1/              # AppFactory 正式接口

components/ + features/           # AgentHub
knowhub/                          # KnowHub，冻结
app_factory/                      # AppFactory 主体
├─ components/
├─ features/
├─ server/
├─ skills/
├─ templates/
├─ contracts/
└─ types/

storage/
├─ agenthub/agenthub.db
├─ agenthub/skills/               # AgentHub 配置型 Skill
├─ knowhub/                       # 冻结
└─ appfactory/
   ├─ appfactory.db
   ├─ workspaces/
   ├─ sessions/
   ├─ builds/
   └─ runtime/
```

AppFactory 可暂时复用 `components/ui`、基础主题和 `lib/utils`，但不得直接依赖 AgentHub 的业务组件、Repository 或数据库。跨产品交互必须通过明确的 Client/Service 接口。

## 5. 已确认的技术方案

### 5.1 数据层

- AgentHub 与 AppFactory 各用独立 SQLite，不共库。
- 使用现有 `better-sqlite3`，启用 WAL、foreign keys 和 busy timeout。
- 采用简单 SQL migration + 幂等 seed + Repository + Service + Route Handler。
- 页面和组件不得直接操作数据库；暂不引入 ORM。
- 现有演示记录转成首次 seed，之后不再作为运行时事实源。
- 源码、日志和构建文件放文件系统，数据库保存元数据、状态和路径。

最小表范围：

```text
AgentHub:   applications, workflows, capabilities, 可选 jobs/settings
AppFactory: projects, sessions, runs, jobs, builds, releases,
            deployments, capability_bindings
```

### 5.2 后台任务

- Next.js Cache 只用于读取缓存，不得当队列。
- 首版使用 `SQLite jobs + 独立 Worker 脚本/进程`。
- Pi Run、依赖安装、Preview、Build 和 Release 都要有可恢复、可观察的任务状态。
- Route Handler 不长时间等待构建；前端通过 SSE 或轮询查看进度。
- 目标是自托管 Node.js，相关接口不得使用 Edge Runtime。

### 5.3 Pi Harness

- 使用官方 `@earendil-works/pi-coding-agent` SDK，固定已验证版本。
- AppFactory 自己定义 `HarnessRuntime` 和统一 `HarnessEvent`；UI 和数据库不得绑定 Pi 原始事件。
- 第一版实现 `PiHarnessRuntime`，未来可增加 Codex/DeepSeek Adapter。
- 每个项目使用独立 `cwd`、Session 和 Workspace。
- 文件、搜索、编辑和命令工具必须限制在当前 Workspace；命令有超时、输出限制和环境变量白名单。
- 默认 Coding Skill 和 references 由 AppFactory 自己加载。

### 5.4 默认生成应用

统一沿用：

```text
Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui
```

基于现有 `nextjs-build` 规则补充 AppFactory 约束：

- 必须包含 `app.yaml`。
- 必须通过结构、Contract、Lint、TypeScript 和生产 Build 检查。
- 禁止硬编码 AgentHub、内部系统地址和密钥。
- 企业能力通过 Capability ID 和平台 Client/Gateway 调用。
- 不把完整应用堆在一个文件中。

### 5.5 Preview、Build 与运行

首版不要求 Docker：

- Preview：受管 Next.js dev process，AppFactory 分配端口、记录日志并嵌入预览区。
- Build：Contract Check → Lint → TypeScript → `next build`。
- Release：保存不可变版本和构建元数据。
- Local Deployment：优先运行 Next.js standalone 或等价稳定 Node 产物。
- 预留轻量 `DeploymentRuntime`，本轮只实现 Local Process Runtime。

### 5.6 AgentHub 集成

AgentHub 新增 `/api/agenthub/v1`，至少覆盖能力列表/详情及应用查询/注册/更新。

AppFactory 定义 `AgentHubClient`，支持：

```text
disabled  独立运行，不连接 AgentHub
local     当前同仓，通过窄的本地 Adapter 调用 AgentHub Service
http      拆分部署，通过 AGENT_HUB_BASE_URL 调用版本化 API
```

AppFactory 不得直接读写 AgentHub SQLite。

### 5.7 用户与权限预留

本轮不做登录、密码和 RBAC，但避免未来重写：

- 所有写操作经过 Route Handler → Service。
- 建立极薄的 `RequestContext/getRequestActor()`，当前返回 `local-user/system`。
- 需要归属的表可保留可空 `owner_id/created_by/updated_by`，不建用户外键。
- 密钥只从服务端环境变量或 Secret Resolver 读取。
- 不实现临时密码、伪权限或强制登录。

以后增加 SSO/RBAC 时，主要替换 Actor 获取并在 Service 层增加策略。

## 6. 开发阶段

### 阶段 0：基线与基础设施

- 记录现有功能、数据来源、启动和构建基线。
- 建立 SQLite、migration、seed、统一错误和 Request Context。
- 将当前 Next.js 16.x 升级到已修复安全问题的兼容版本并验证。
- 固化 AgentHub、AppFactory、KnowHub 的 import 与存储边界。

### 阶段 1：AgentHub 应用和业务流正式化

- Applications、Workflows 迁移到 SQLite。
- 建立 Repository、Service、Zod DTO 和正式 API。
- 当前演示记录转为 seed，前端移除 localStorage 事实源。
- 验证重启持久化、错误和并发覆盖的最小保护。

### 阶段 2：AgentHub 能力注册与跨服务接口

- 建立 Capability Registry，统一展示元数据和实际执行来源。
- 代码 Tool 通过 `handler_key` 适配，外部 API 使用 Schema、endpoint 和 `credential_ref`。
- 完善 Application Registry，支持 AppFactory 来源、版本、状态和入口。
- 在“配置管理”后增加弱化的“应用开发 ↗”服务入口，默认 `/appfactory`，可配置独立域名。

### 阶段 3：AppFactory 独立壳与后端基础

- 建立 `app/appfactory`、`app_factory`、`/api/appfactory/v1` 和独立存储。
- 建立独立 Layout、项目列表、新建项目和项目详情工作区。
- 建立 AppFactory 数据、服务层和 SQLite Jobs Worker。
- 支持 `disabled/local/http` 三种 AgentHub 集成模式。

### 阶段 4：Pi Harness 与 Workspace

- 实现 Harness 抽象、Pi Adapter、Session 持久化与恢复。
- 实现 Workspace 边界、受控工具、命令超时和日志。
- 接入默认 Next.js Skill、references 和项目模板。
- 完成对话、Tool Call、文件/Diff、日志等开发工作区。

### 阶段 5：Preview、Build、Release 与本地运行

- 实现端口、进程和 Preview 管理。
- 实现 `app.yaml`、Contract/结构检查和 Build Pipeline。
- 实现 Release、Local Deployment、健康检查和稳定入口。
- AppFactory 内可独立打开和测试 Preview/已发布应用。

### 阶段 6：能力绑定、AgentHub 注册与交付验证

- 为 Pi 提供能力搜索、详情、绑定和测试工具。
- 生成应用通过 Capability ID 调用能力。
- 发布后可选注册/更新 AgentHub 应用中心；注册失败不回滚本地 Release。
- 完成端到端验证、清理重复数据源与硬编码，并更新开发文档。

## 7. 总体验收标准

1. 工作台仍是首页，现有工作台和 Skill 主流程不回退。
2. KnowHub 无非必要修改。
3. AgentHub 的应用、业务流和能力记录由服务端与 SQLite 管理。
4. AppFactory 有独立 Layout、API、数据库、Workspace 和服务端运行逻辑。
5. AppFactory 在没有 AgentHub 时可完成项目创建、Pi 开发、Preview、Build、Release 和本地运行。
6. 发布应用可选注册 AgentHub，并从应用中心正常打开。
7. 任务、构建和进程失败有可见状态；重启后项目和 Release 不丢失。
8. 无明文密钥，Workspace 有边界，命令有超时与输出限制。
9. 全项目通过 Lint、TypeScript、生产 Build 和核心浏览器流程验证。
10. AppFactory 与 AgentHub 风格协调但有独立识别；开发工作区占据首屏主体，不用大 Hero、大标签区和无效留白挤占功能。

## 8. 本轮明确不做

- 用户注册、登录、密码、SSO、RBAC、多租户和资源级权限。
- AgentHub 工作台迁移到 Pi。
- KnowHub 业务修改。
- Redis/BullMQ/Kafka、Docker/Kubernetes 多租户 Sandbox。
- 微前端、拖拽低代码、跨框架 UI 拼装。
- 多 Agent、插件市场和复杂云端协同编辑。

## 9. 进度维护

- 本文只记录长期目标与架构决定，不写日常流水账。
- `todo-list.md` 是唯一进度事实源；任务完成并验证后才勾选。
- 每次结束前更新当前阶段、最近完成、验证、下一步和阻塞项。
- 如实现必须偏离本文，先在 TODO 记录原因；架构决定改变时再更新本文。
