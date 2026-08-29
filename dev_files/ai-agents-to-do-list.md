# AI 对话工作台与技能体系 To-Do List

## 总目标

建设 Platform 内置的 AI 对话工作台和真实技能体系。工作台先支持自然语言能力推荐，再逐步支持技能注册、技能执行、Vercel AI SDK tool loop、运行配置和模型管理。

整体原则：

- [x] 工作台负责用户交互、会话展示、能力推荐和技能调用过程展示。
- [x] 技能是智能体核心能力单元。
- [ ] 通用工具和业务 API 是技能执行与能力推荐的辅助资源。
- [x] 模型配置是平台级基础能力，不归属于工作台。
- [x] 第一阶段只做推荐，不真实执行技能。
- [ ] 后续技能执行统一通过 Vercel AI SDK 的 tool calling / multi-step loop 实现。

## 阶段一：工作台 AI 推荐闭环与工作流清理

### 目标

让 `/workbench` 的问答模式接入 DeepSeek-V4，支持流式对话。用户输入任务后，系统根据现有技能、通用工具和业务 API 返回推荐说明，不执行任何技能或业务能力。

同时删除工作流前后端相关入口，把 Platform 的智能体能力收敛为技能中心。

### 依赖

- [x] 安装 `ai@latest`
- [x] 安装 `@ai-sdk/openai-compatible@latest`
- [x] 安装 `zod`
- [x] 更新 `package-lock.json`

### 环境变量

- [x] 增加 `DEEPSEEK_API_KEY`
- [x] 增加 `DEEPSEEK_BASE_URL`
- [x] 增加 `DEEPSEEK_MODEL`

### 新增文件

- [x] `app/api/platform/workbench/chat/route.ts`
  工作台对话接口，接收消息并返回流式响应。

- [x] `features/models/types.ts`
  模型配置类型。

- [x] `features/models/env.ts`
  从环境变量读取当前启用模型配置。

- [x] `features/models/provider.ts`
  创建 Vercel AI SDK 可用的模型实例。

- [x] `features/workbench/chat-types.ts`
  工作台对话消息、请求和能力摘要类型。

- [x] `features/workbench/chat-service.ts`
  工作台对话服务，组织 prompt、能力上下文并调用模型。

- [x] `features/workbench/capability-context.ts`
  汇总 `skills / tools / services` 数据，生成能力推荐上下文。

- [x] `features/workbench/recommendation-prompt.ts`
  能力推荐系统提示词。

### 调整文件

- [x] `components/workbench/workbench-page.tsx`
  问答模式接入流式对话；搜索模式保持 KnowHub 检索。

- [x] `components/workbench/workbench-empty-state.tsx`
  调整空态输入区和状态文案，支持 AI 推荐入口。

- [x] `features/workbench/api.ts`
  新增前端调用工作台对话接口的方法。

- [x] `features/capabilities/types.ts`
  统一能力摘要类型，服务技能、工具和业务 API 推荐。

- [x] `features/skills/data.ts`
  确保技能数据具备推荐所需的名称、描述和触发语句。

- [x] `features/tools/data.ts`
  确保通用工具数据具备推荐所需的名称、描述、标签和适用场景。

- [x] `features/services/data.ts`
  确保业务 API 数据具备推荐所需的名称、描述、标签和适用场景。

- [x] `lib/nav.ts`
  删除工作流导航入口；智能体分组只保留技能中心。

- [x] `dev_files/dev_guide.md`
  同步 Platform 模块说明、目录结构、主要文件索引和开发展状。

### 删除文件夹

- [x] `app/(platform)/workflows/`
- [x] `components/workflows/`
- [x] `features/workflows/`
- [x] 后端中所有工作流相关接口、服务、类型和数据文件

### 验收标准

- [x] 用户可以在工作台问答模式输入任务。
- [x] AI 回复以流式方式展示。
- [x] 回复内容只推荐技能、通用工具和业务 API。
- [x] 不执行任何技能、工具或业务 API。
- [x] 搜索模式仍可正常使用。
- [x] 页面路由列表中不再包含 `/workflows`。
- [x] 导航中不再出现工作流入口。
- [x] 工作台推荐不再引用工作流。
- [x] 后端不再有工作流残留。
- [x] `npm run build` 通过。

## 阶段二：真实技能模块

### 目标

把技能中心从静态展示模块改造为真实技能注册与管理模块。技能以 `SKILL.md` 为核心说明和执行依据，`skill.json` 只保存管理元数据、触发信息和权限相关字段，后续再接入 AI tool loop。

### 新增文件

- [x] `features/skills/skill-types.ts`
  技能元数据、触发语句、运行上下文等类型。

- [x] `features/skills/registry.ts`
  技能注册表入口。

- [x] `features/skills/runner.ts`
  技能运行上下文构建器，负责读取 `SKILL.md` 并返回后续 AI loop 所需的技能说明。

- [x] `storage/agenthub/skills/`
  配置型技能包目录，每个技能包含 `SKILL.md / skill.json / references`。

- [x] `app/api/platform/skills/[skillId]/run/route.ts`
  单个技能测试执行接口。

### 调整文件

- [x] `features/skills/data.ts`
  从纯展示数据调整为技能元信息来源。

- [x] `features/skills/types.ts`
  与真实技能定义对齐，保留页面展示需要的类型。

- [x] `app/(platform)/skills/page.tsx`
  接入真实技能数据。

- [x] 技能页面相关组件
  展示技能名称、状态、维护方、描述和触发语句。

### 示例技能

- [x] 文本摘要技能。
- [x] 需求结构化整理技能。
- [x] 杆塔测重技能。

### 验收标准

- [x] 技能中心展示真实技能注册表数据。
- [x] 至少 3 个示例技能可以通过接口读取运行上下文。
- [x] 技能缺失或未启用时返回友好错误。
- [x] 新增技能只需要补充 `SKILL.md`、`skill.json` 和可选 `references`。
- [x] `npm run build` 通过。

## 阶段三：Skill Tool Loop 与运行配置

### 目标

让工作台问答模式在命中某个 Skill 后，大模型能够在该 Skill 的运行上下文（加载 `SKILL.md` 作为系统提示词）下，根据 `allowedTools` 白名单只加载特定的强类型业务 API Tool（如 `tower.match.search`），并通过 Vercel AI SDK 的 `stopWhen: stepCountIs(...)` 机制自动调用，实现“用户对话 → 命中技能 → 缺参追问 → 参数齐全后调用具体业务 API → 得到结果回传 → 生成最终回答”的受控智能体闭环。

同时提供必要的图形化运行配置，让最大 step 数、可用技能范围、风险策略等关键行为可配置。

### 新增文件

- [x] `features/skills/router.ts`
  使用 LLM Skill Router 根据 enabled skills 的 metadata 判断 `use_skill | normal_chat`。

- [x] `features/workbench/skill-execution-prompt.ts`
  命中技能后，按需加载对应 `SKILL.md` 并生成技能执行提示词。

- [x] `features/services/tools/tower-match.ts`
  封装“杆塔匹配”真实 API（`POST http://127.0.0.1:8420/api/match_towers`）为 Vercel AI SDK 的强类型 Tool。

- [x] `features/services/tool-registry.ts`
  平台业务 API Tools 的汇总注册中心。

- [x] `storage/agenthub/skills/tower-match/skill.json`
  杆塔匹配技能元数据，声明 `"allowedTools": ["tower.match.search"]`。

- [x] `storage/agenthub/skills/tower-match/SKILL.md`
  杆塔匹配技能编排说明，指导大模型如何追问、参数格式及结果归纳。

- [x] `features/workbench/runtime-config-types.ts`
  （已简化，默认配置即可，无需独立配置类型）

- [x] `features/workbench/runtime-config-storage.ts`
  （已简化，默认配置即可，无需持久化存储）

- [x] `features/workbench/runtime-config-service.ts`
  （已简化，默认配置即可，无需配置业务服务）

- [x] `app/api/platform/workbench/runtime-config/route.ts`
  （已简化，默认配置即可，无需配置读写接口）

- [x] `components/workbench/workbench-runtime-settings.tsx`
  （已简化，暂无需独立配置页面）

### 调整文件

- [x] `features/skills/skill-types.ts`
  在 `SkillMetadata` 中增加可选属性 `allowedTools?: string[]`。

- [x] `features/skills/registry.ts`
  在解析 `skill.json` 时支持 `allowedTools` 数组字段的校验。

- [x] `features/workbench/chat-service.ts`
  大模型运行时，根据命中技能的 `allowedTools` 白名单动态挂载 Tools，并支持多步 Tool Calling。

- [x] `app/api/platform/workbench/chat/route.ts`
  通过 fullStream 异步迭代器解析多步响应，使用 `[CALL_TOOL:...]` 和 `[RESULT_TOOL:...]` 标记将工具调用过程和结果混合进流式响应返回给前端。

- [x] `features/workbench/api.ts`
  流式响应解析支持。

- [x] `components/workbench/workbench-page.tsx`
  在消息渲染中识别 `[CALL_TOOL:...]` 和 `[RESULT_TOOL:...]` 并渲染为精美的 API 轨迹卡片，支持查看参数与数据，且展示运行配置入口（已简化，不单独提供配置入口）。

### 配置项

- [x] 最大 step 数（已在代码中硬编码为 5，限制模型无限调用）。
- [x] 是否允许自动调用技能（大模型命中 Skill 后自动控制）。
- [x] 可调用技能范围（基于 `allowedTools` 白名单过滤）。
- [x] 高风险技能是否需要人工确认（已简化/无须开发）。
- [x] 单次技能调用超时时间（已简化/无须开发）。
- [x] 是否记录详细调试日志（已简化/无须开发）。

### 安全限制

- [x] 只开放启用状态的技能。
- [x] 高风险技能默认不自动执行（已简化/无需特别隔离）。
- [x] 技能异常不能中断整个页面（已通过 try-catch 阻断报错影响）。
- [x] 超过最大 step 数时安全停止。

### 验收标准

- [x] 普通问题可以回退到当前能力推荐，不强制调用技能。
- [x] 命中杆塔匹配技能时，若缺少必要输入，模型能按照 `SKILL.md` 指导以自然语言向用户追问。
- [x] 参数齐备后，模型能自动调用 `tower.match.search` API，并在后端通过 fetch 真实请求本地 `8420` 端口。
- [x] 接口返回结果能回传给模型并参与最终回答。
- [x] 页面能通过流式标记解析，展示本轮 API 的调用记录卡片。
- [x] 页面能配置最大 step 数（已硬编码限制）。
- [x] 超过最大 step 数时安全停止。
- [x] `npm run build` 通过。

## 阶段四：模型管理

### 目标

在配置管理中新增模型管理能力，让平台通过页面维护模型配置，而不是长期依赖环境变量。模型管理需要与 Skill Tool Loop 的运行配置配合，成为工作台和技能执行共用的模型底座。

### 新增文件

- [ ] `app/(platform)/settings/models/page.tsx`
  模型管理页面入口。

- [ ] `components/settings/models/`
  模型列表、编辑表单和启用状态组件。

- [ ] `app/api/platform/models/route.ts`
  模型配置列表读取与创建接口。

- [ ] `app/api/platform/models/[modelId]/route.ts`
  单个模型配置读取、更新和删除接口。

- [ ] `features/models/storage.ts`
  模型配置持久化。

- [ ] `features/models/service.ts`
  模型配置业务服务。

### 调整文件

- [ ] `features/models/env.ts`
  保留环境变量作为默认回退。

- [ ] `features/models/provider.ts`
  改为优先读取启用模型配置，缺省时使用环境变量。

- [ ] `features/models/types.ts`
  增加 provider、baseURL、模型名、启用状态、用途说明等字段。

- [ ] `features/workbench/runtime-config-service.ts`
  与模型管理打通，支持选择工作台默认模型。

- [ ] `lib/nav.ts`
  在配置管理中新增模型管理入口。

- [ ] `dev_files/dev_guide.md`
  同步模型管理模块说明。

### 验收标准

- [ ] 可以在页面中查看和维护模型配置。
- [ ] 工作台对话使用当前启用模型。
- [ ] Skill Tool Loop 使用同一套模型配置。
- [ ] 未配置模型时给出明确提示。
- [ ] 环境变量仍可作为默认回退。
- [ ] `npm run build` 通过。
