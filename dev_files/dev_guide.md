# Ai Platform 开发说明

## 项目简介

`Ai Platform` 是一个面向企业级场景的智能体平台前端，统一承载工作台、工具、服务、技能和知识业务入口。

当前代码分成两条主线：

- `Platform`：`workbench / tools / services / skills`
- `KnowHub`：平台内独立的知识业务域，包含文档空间、策略中心、知识库、检索与配置管理

## 技术路线

- 前端：`Next.js + React + TypeScript`
- 路由与接口：`Next.js App Router + Route Handlers`
- 样式与 UI：`Tailwind CSS`，全局样式入口是 `app/globals.css`
- Platform 数据：`workbench` 的知识搜索走真实接口，能力中心与智能体模块按模块状态分别接真实接口或静态数据
- Platform AI：工作台问答通过 Vercel AI SDK 接入 DeepSeek-V4，当前只做技能、工具和业务 API 推荐
- Platform Skills：技能中心读取 `storage/platform/skills` 中的配置型技能包，`SKILL.md` 是技能执行核心，`skill.json` 只保存管理元数据
- 技能创建规范：见 `dev_files/create_skills_guide.md`
- KnowHub 数据：文档空间、知识库、策略预设、embedding 配置走本地文件持久化；向量数据走 `SQLite + sqlite-vec`

## 边界说明

- `app`：路由入口、布局和 API route
- `app/(platform)`：Platform 路由入口层
- `app/knowhub`：KnowHub 路由入口层
- `components` 与 `features`：Platform 页面实现、共享组件和业务逻辑
- `knowhub/components` 与 `knowhub/features`：KnowHub 页面实现、共享组件和业务逻辑
- `storage/knowhub`：KnowHub 本地持久化目录
- `storage/platform/skills`：Platform 配置型技能包目录，每个技能包含 `SKILL.md / skill.json / references`
- `reference`：外部参考实现与调研素材
- `dev_files`：项目开发文档与阶段性 checklist
- `components/ui` 与 `lib`：跨模块基础控件和平台级工具

## 当前目录结构

```txt
Ai_Platform/
├─ app/
│  ├─ (platform)/
│  │  ├─ portal/
│  │  ├─ workbench/
│  │  ├─ tools/
│  │  ├─ services/
│  │  └─ skills/
│  ├─ api/
│  │  └─ platform/
│  ├─ knowhub/
│  │  ├─ docspace/
│  │  ├─ strategies/
│  │  ├─ settings/
│  │  ├─ knowledge/
│  │  └─ retrieval/
├─ components/
│  ├─ shared/
│  ├─ ui/
│  └─ workbench/
├─ features/
│  ├─ capabilities/
│  ├─ models/
│  ├─ services/
│  ├─ skills/
│  ├─ tools/
│  └─ workbench/
├─ knowhub/
│  ├─ components/
│  │  ├─ docspace/
│  │  ├─ layout/
│  │  ├─ knowledge/
│  │  ├─ overview/
│  │  ├─ retrieval/
│  │  ├─ settings/
│  │  ├─ shared/
│  │  └─ strategies/
│  └─ features/
│     ├─ docspace/
│     ├─ knowledge/
│     ├─ overview/
│     ├─ retrieval/
│     ├─ settings/
│     ├─ strategies/
│     └─ vector-store/
├─ dev_files/
├─ reference/
├─ storage/
│  ├─ knowhub/
│  └─ platform/
│     └─ skills/
├─ public/
└─ lib/
```

目录树只展示到文件夹级别；具体文件职责见下方 `Platform` 与 `KnowHub` 的“主要文件索引”。

## Platform 说明

### 1. 功能模块说明

- `workbench`：用户工作台，支持知识搜索和能力推荐入口
- `tools`：通用工具
- `services`：业务API
- `skills`：技能中心

### 2. 文件组织方式

- `app/(platform)/*`：Platform 路由入口层，只负责接住页面和动态参数
- `components/*`：Platform 页面实现层，按 `workbench / shared / ui` 分组
- `features/*`：Platform 业务数据、类型和接口封装层
- `features/models/*`：平台级模型运行时封装，工作台和后续技能执行共用
- `components/shared/*`：Platform 共享壳层、导航和通用页面结构
- `components/ui/*`：Platform 与 KnowHub 共用的基础控件

### 3. 主要文件索引

Platform 路由入口：

- 平台默认首页入口：`app/page.tsx`
- 全局布局入口：`app/layout.tsx`
- 全局样式入口：`app/globals.css`
- Platform 布局入口：`app/(platform)/layout.tsx`
- 默认工作台路由入口：`app/(platform)/workbench/page.tsx`
- 工作台 AI 推荐接口：`app/api/platform/workbench/chat/route.ts`
- 技能运行上下文接口：`app/api/platform/skills/[skillId]/run/route.ts`
- 通用工具路由入口：`app/(platform)/tools/page.tsx`
- 业务API路由入口：`app/(platform)/services/page.tsx`
- 技能中心路由入口：`app/(platform)/skills/page.tsx`

Platform 页面组件：

- 工作台主容器：`components/workbench/workbench-page.tsx`
- 工作台空态页：`components/workbench/workbench-empty-state.tsx`
- 工作台搜索结果区：`components/workbench/workbench-search-result-pane.tsx`
- 技能中心客户端页面：`components/skills/skills-page-client.tsx`

Platform 共享与基础组件：

- Platform 统一页面壳：`components/shared/app-shell.tsx`
- Platform 顶部导航：`components/shared/top-nav.tsx`
- 平台卡片页通用外框：`components/shared/card-page-frame.tsx`
- 能力中心通用卡片：`components/shared/capability-card.tsx`
- Markdown 消息渲染组件：`components/shared/message-markdown.tsx`
- 页面占位组件：`components/shared/page-placeholder.tsx`
- 基础按钮组件：`components/ui/button.tsx`
- 按钮样式变体定义：`components/ui/button-variants.ts`
- 基础输入框组件：`components/ui/input.tsx`
- 基础标签组件：`components/ui/badge.tsx`

Platform 业务数据与工具：

- 工作台知识库列表与搜索 API 封装：`features/workbench/api.ts`
- 工作台对话服务：`features/workbench/chat-service.ts`
- 工作台技能执行提示词：`features/workbench/skill-execution-prompt.ts`
- 工作台能力推荐上下文：`features/workbench/capability-context.ts`
- 工作台能力推荐提示词：`features/workbench/recommendation-prompt.ts`
- 工作台对话类型：`features/workbench/chat-types.ts`
- 模型环境配置读取：`features/models/env.ts`
- 模型 provider 封装：`features/models/provider.ts`
- 模型配置类型：`features/models/types.ts`
- 通用工具数据：`features/tools/data.ts`
- 通用工具类型定义：`features/tools/types.ts`
- 业务API数据：`features/services/data.ts`
- 业务API类型定义：`features/services/types.ts`
- 技能中心数据：`features/skills/data.ts`
- 技能中心类型定义：`features/skills/types.ts`
- 技能定义类型：`features/skills/skill-types.ts`
- 技能注册表：`features/skills/registry.ts`
- 技能运行上下文构建器：`features/skills/runner.ts`
- 技能路由器：`features/skills/router.ts`
- 配置型技能包目录：`storage/platform/skills/（技能名称）/`
- 能力卡片共用类型：`features/capabilities/types.ts`
- Platform 导航配置：`lib/nav.ts`
- 通用工具函数：`lib/utils.ts`

### 4. 模型 provider/runtime 说明

- 模型运行时入口：`features/models/provider.ts`
- 模型环境配置读取：`features/models/env.ts`
- 模型运行时类型：`features/models/types.ts`
- 工作台只调用 `getActiveModelRuntime()`，不直接写 DeepSeek、豆包等厂商参数
- 厂商差异统一收口在 `features/models/provider.ts`，包括 Vercel AI SDK model 实例和 `providerOptions`
- 新增模型 provider 时，优先扩展 `features/models`，不要把 provider 专属参数写进 `features/workbench`

## KnowHub 说明

### 1. 功能模块说明

- `overview`：知识域概览页
- `docspace`：文档中心
- `strategies`：策略中心，支持真实模板、预设与切片测试
- `knowledge`：知识库列表、详情、建库与运行记录
- `settings/global-strategies`：全局默认策略配置与 embedding 配置入口
- `retrieval`：检索验证页，也是 Platform 搜索模式复用的后端入口

### 2. 文件组织方式

- 命名约定：英文路径、目录、接口统一使用 `docspace`；功能模块中文名称使用“文档中心”；文档中心中的单个实例使用“文档空间”
- `app/knowhub/*`：KnowHub 路由入口层，只做路由承接和参数归一化
- `app/api/knowhub/*`：KnowHub 接口入口层，包含 `docspace / strategies / knowledge / settings / retrieval`
- `knowhub/components/*`：KnowHub 页面实现层，按 `overview / docspace / strategies / knowledge / retrieval / settings / shared` 分组
- `knowhub/features/*`：KnowHub 业务逻辑、类型、持久化、执行器与服务端能力
- `knowhub/features/vector-store/*`：向量库适配层
- `storage/knowhub/*`：本地持久化文件、策略预设、知识库记录、embedding 配置和向量库文件

### 3. 主要文件索引

KnowHub 路由与接口入口：

- KnowHub 独立布局入口：`app/knowhub/layout.tsx`
- KnowHub 概览页路由入口：`app/knowhub/page.tsx`
- 文档中心列表页路由入口：`app/knowhub/docspace/page.tsx`
- 单个文档空间详情页路由入口：`app/knowhub/docspace/[id]/page.tsx`
- 策略中心路由入口：`app/knowhub/strategies/page.tsx`
- 知识中心列表页路由入口：`app/knowhub/knowledge/page.tsx`
- 知识库详情页路由入口：`app/knowhub/knowledge/[id]/page.tsx`
- 全局策略页路由入口：`app/knowhub/settings/global-strategies/page.tsx`
- 检索页路由入口：`app/knowhub/retrieval/page.tsx`
- 文档空间列表读取与创建接口：`app/api/knowhub/docspace/route.ts`
- 单个文档空间详情读取与删除接口：`app/api/knowhub/docspace/[id]/route.ts`
- 文档空间文件列表接口：`app/api/knowhub/docspace/[id]/files/route.ts`
- 文档空间手动同步接口：`app/api/knowhub/docspace/[id]/sync/route.ts`
- 本地空间文件上传接口：`app/api/knowhub/docspace/[id]/upload/route.ts`
- OSS 与 SMB 测试连接接口：`app/api/knowhub/docspace/test-connection/route.ts`
- 知识库列表读取与创建接口：`app/api/knowhub/knowledge/route.ts`
- 单个知识库详情接口：`app/api/knowhub/knowledge/[id]/route.ts`
- 知识库建库运行接口：`app/api/knowhub/knowledge/[id]/run/route.ts`
- 策略预设列表与创建接口：`app/api/knowhub/strategies/presets/route.ts`
- 单个策略预设更新接口：`app/api/knowhub/strategies/presets/[id]/route.ts`
- 策略测试接口：`app/api/knowhub/strategies/test/route.ts`
- embedding 配置接口：`app/api/knowhub/settings/embedding/route.ts`
- 检索接口：`app/api/knowhub/retrieval/search/route.ts`

KnowHub 共享与概览：

- KnowHub 顶部导航：`knowhub/components/shared/knowhub-top-nav.tsx`
- KnowHub 列表页通用工具栏：`knowhub/components/shared/page-toolbar.tsx`
- KnowHub 卡片网格布局：`knowhub/components/shared/card-grid.tsx`
- KnowHub 占位面板：`knowhub/components/shared/coming-soon-panel.tsx`
- KnowHub 页面通用外框：`knowhub/components/layout/knowhub-page-shell.tsx`
- 概览页主组件：`knowhub/components/overview/overview-page.tsx`
- 概览页介绍面板：`knowhub/components/overview/intro-panel.tsx`
- 概览统计卡片：`knowhub/components/overview/stat-card.tsx`
- 概览流程阶段卡片：`knowhub/components/overview/flow-stage-card.tsx`

KnowHub 文档中心：

- 文档中心列表页主组件：`knowhub/components/docspace/docspace-page.tsx`
- 文档空间卡片：`knowhub/components/docspace/docspace-card.tsx`
- 文档空间创建弹窗：`knowhub/components/docspace/docspace-create-dialog.tsx`
- 文档空间详情页主组件：`knowhub/components/docspace/docspace-detail-page.tsx`
- 文档空间文件浏览区：`knowhub/components/docspace/docspace-file-preview.tsx`
- 本地空间上传控件：`knowhub/components/docspace/docspace-upload-control.tsx`
- 远程空间同步控件：`knowhub/components/docspace/docspace-sync-control.tsx`
- 文档空间删除控件：`knowhub/components/docspace/docspace-delete-button.tsx`

KnowHub 策略中心：

- 策略中心主页面：`knowhub/components/strategies/strategies-page.tsx`
- 策略分类切换条：`knowhub/components/strategies/strategy-bar.tsx`
- 策略卡片：`knowhub/components/strategies/strategy-card.tsx`
- 策略详情抽屉：`knowhub/components/strategies/strategy-detail-drawer.tsx`
- 策略参数表单：`knowhub/components/strategies/strategy-settings-form.tsx`
- 策略测试面板：`knowhub/components/strategies/strategy-test-panel.tsx`
- 策略分类配色定义：`knowhub/components/strategies/strategy-colors.ts`

KnowHub 知识中心、检索与配置管理：

- 知识中心列表页主组件：`knowhub/components/knowledge/knowledge-page.tsx`
- 知识库卡片：`knowhub/components/knowledge/knowledge-card.tsx`
- 知识库详情页主组件：`knowhub/components/knowledge/knowledge-detail-page.tsx`
- 知识库运行按钮：`knowhub/components/knowledge/knowledge-run-button.tsx`
- 新建知识库弹窗：`knowhub/components/knowledge/knowledge-builder-dialog.tsx`
- 文件夹域选择弹窗：`knowhub/components/knowledge/file-scope-picker-dialog.tsx`
- 文件夹策略弹窗：`knowhub/components/knowledge/folder-strategy-dialog.tsx`
- 策略阶段编辑组件：`knowhub/components/knowledge/strategy-stage-editor.tsx`
- 检索页主组件：`knowhub/components/retrieval/retrieval-page.tsx`
- 检索结果面板：`knowhub/components/retrieval/retrieval-results-panel.tsx`
- 全局策略页主组件：`knowhub/components/settings/global-strategy-page.tsx`
- Embedding 配置面板：`knowhub/components/settings/embedding-settings-panel.tsx`

KnowHub 业务数据与服务：

- `docspace`：文档空间核心业务域，负责元数据、连接测试、文件扫描、原文读取与本地持久化
- 文档空间前端请求封装：`knowhub/features/docspace/api.ts`
- 文档空间统一读取服务：`knowhub/features/docspace/file-reader.ts`
- 文档空间服务端业务逻辑：`knowhub/features/docspace/service.ts`
- 文档空间元数据读写：`knowhub/features/docspace/repository.ts`
- 文档空间本地持久化与托管目录操作：`knowhub/features/docspace/storage.ts`
- OSS 连接与对象读取：`knowhub/features/docspace/oss-connector.ts`
- SMB 连接与共享目录读取：`knowhub/features/docspace/smb-connector.ts`
- 文档空间类型定义：`knowhub/features/docspace/types.ts`
- `strategies`：策略模板、预设、测试与执行器
- 策略静态展示数据：`knowhub/features/strategies/data.ts`
- 策略模板与预设类型定义：`knowhub/features/strategies/types.ts`
- 策略模板注册中心：`knowhub/features/strategies/registry.ts`
- 策略预设存储：`knowhub/features/strategies/preset-storage.ts`
- 策略预设读写：`knowhub/features/strategies/preset-repository.ts`
- 策略服务：`knowhub/features/strategies/service.ts`
- Markdown 切片执行器：`knowhub/features/strategies/executors/markdown-obsidian-slicer.ts`
- `knowledge`：知识库记录、建库运行、切片入库与运行状态
- 知识库前端请求封装：`knowhub/features/knowledge/api.ts`
- 知识库类型定义：`knowhub/features/knowledge/types.ts`
- 知识库构建器数据：`knowhub/features/knowledge/builder-data.ts`
- 知识库构建器类型：`knowhub/features/knowledge/builder-types.ts`
- 知识库本地持久化：`knowhub/features/knowledge/storage.ts`
- 知识库记录读写：`knowhub/features/knowledge/repository.ts`
- 知识库服务：`knowhub/features/knowledge/service.ts`
- 建库流水线：`knowhub/features/knowledge/build-service.ts`
- Embedding 运行时客户端：`knowhub/features/knowledge/embedding-client.ts`
- `retrieval`：查询向量化、向量检索和结果整形
- 检索结果类型定义：`knowhub/features/retrieval/types.ts`
- 检索服务：`knowhub/features/retrieval/service.ts`
- `settings/embedding`：embedding 配置类型、存储与服务
- Embedding 配置类型：`knowhub/features/settings/embedding/embedding-types.ts`
- Embedding 配置存储：`knowhub/features/settings/embedding/embedding-storage.ts`
- Embedding 配置服务：`knowhub/features/settings/embedding/embedding-config-service.ts`
- `vector-store`：向量库适配层
- 向量库接口定义：`knowhub/features/vector-store/types.ts`
- 向量库适配器入口：`knowhub/features/vector-store/index.ts`
- SQLite 向量库实现：`knowhub/features/vector-store/sqlite-vec-store.ts`
- 概览页数据：`knowhub/features/overview/data.ts`
- 概览页类型定义：`knowhub/features/overview/types.ts`

## 开发现状

### Platform

- `workbench`：KnowHub 搜索模式真实可用，问答模式已接入 DeepSeek-V4 做能力推荐
- `tools / services / skills`：前端原型与静态数据

### KnowHub

- `docspace`：真实后端与本地文件持久化
- `overview`：文档空间数据真实，其余统计仍有静态占位
- `knowledge`：真实 JSON 存储、建库运行记录与向量入库链路
- `strategies`：真实模板、预设、执行器与文件测试
- `settings/global-strategies`：Embedding 配置真实；全局默认策略仍为页面内配置
- `retrieval`：真实检索页与检索 API

## 开发规则

### 通用规则

通用代码风格以“合理、清晰、简洁”为优先。
在满足需求、结构清楚和便于维护的前提下，代码尽量精简，不做不必要的抽象、兼容层和铺垫。

- 优先采用直接、稳定、易维护的实现方式。
- 能简单解决的问题，不额外增加封装层级、状态复杂度或样式负担。
- 修改后同步删除遗留代码、弃用代码、调试代码和无效样式，不保留无用内容，也不用备注变更过程内容。
- 新增代码以长期维护为前提，不为了技巧感牺牲可读性。

### 项目规则

- 路由层只接路由和参数，不承载页面实现。
- Platform 改 `app/(platform)`、`components`、`features`，KnowHub 改 `app/knowhub`、`app/api/knowhub`、`knowhub/components`、`knowhub/features`。
- 共享层放对位置：Platform 共享放 `components/shared`，KnowHub 私有共享放 `knowhub/components/shared`，基础控件放 `components/ui`。
- KnowHub 保持独立导航、全宽布局、策略中心单一路由和全局策略独立配置入口。

## dev_guide 编写原则

- 只写当前有效状态，不写变更过程、历史路径或“原来是 A、现在改成 B”。
- 目录、文件职责、文件名称、模块边界发生变化时，同步更新本文件，需要检查 `## 当前目录结构` 和对应模块的内容是否要调整。
- 模块说明、边界说明、文件组织方式、开发现状等列表项，优先采用“一行标签式”写法。
- 每个文件说明只写当前职责，不写实现细节、重构原因或临时方案。
- 优先写稳定结构和高频落点，避免记录容易过时的界面细节或临时数据。
