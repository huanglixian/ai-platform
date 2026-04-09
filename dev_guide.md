# Ai Platform 开发说明

## 项目简介

`Ai Platform` 是一个面向企业级场景的智能体平台前端，负责统一承载智能体工作台、流程编排、数据中心、工具与服务接入等业务入口与交互界面。数据中心里的知识库 `KnowHub` 由于功能复杂度更高，当前作为独立模块组织，方便后续单独演进。

因此，当前代码里有两条主线：

- `Platform`：`bots / workflows / tools / services / skills`
- `KnowHub`：平台内独立的知识业务域，使用独立路由和布局

## 技术路线

- 前端：`Next.js + React + TypeScript`
- 路由与接口：`Next.js App Router + Route Handlers`
- 样式与 UI：`Tailwind CSS`，全局样式入口是 `app/globals.css`，UI 体系是 `Base UI + shadcn 风格约定`
- KnowHub 数据：文档空间支持 `OSS + SMB`，当前未接独立数据库，文档空间数据走本地文件持久化

## 边界说明

- `app`：路由入口、布局和 API route
- `app/(platform)`：Platform 路由入口层
- `app/knowhub`：KnowHub 路由入口层
- `components` 与 `features`：Platform 页面实现、共享组件和业务数据层
- `knowhub/components` 与 `knowhub/features`：KnowHub 页面实现、共享组件和业务数据层
- `components/ui` 与 `lib`：跨模块基础控件和平台级工具

## 当前目录结构

```txt
Ai_Platform/
├─ app/
│  ├─ (platform)/
│  │  ├─ bots/
│  │  ├─ workbench/
│  │  ├─ workflows/
│  │  ├─ tools/
│  │  ├─ services/
│  │  └─ skills/
│  ├─ knowhub/
│  │  ├─ docspace/
│  │  ├─ strategies/
│  │  ├─ settings/
│  │  ├─ knowledge/
│  │  └─ retrieval/
│  └─ api/
├─ components/
│  ├─ bots/
│  ├─ shared/
│  ├─ ui/
│  ├─ workbench/
│  └─ workflows/
├─ features/
│  ├─ bots/
│  ├─ capabilities/
│  ├─ services/
│  ├─ skills/
│  ├─ tools/
│  └─ workflows/
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
│     └─ strategies/
├─ lib/
└─ dev_guide.md
```

目录树只展示到文件夹级别；具体文件职责见下方 `Platform` 与 `KnowHub` 的“主要文件索引”。

## Platform 说明

### 1. 功能模块说明

- `bots`：自由体配置与 Playground
- `workbench`：用户工作台与会话入口
- `workflows`：工作流列表与示例详情
- `tools`：工具中心
- `services`：服务中心
- `skills`：技能中心

### 2. 文件组织方式

- `app/(platform)/*`：Platform 路由入口层，只负责接住页面和动态参数
- `components/*`：Platform 页面实现层，按 `bots / workbench / workflows / shared / ui` 分组
- `features/*`：Platform 业务数据、类型、接口封装层
- `components/shared/*`：Platform 共享壳层、导航和通用页面结构
- `components/ui/*`：Platform 与 KnowHub 共用的基础控件

### 3. 主要文件索引

Platform 路由入口：

- 平台默认首页入口：`app/page.tsx`
- 全局布局入口：`app/layout.tsx`
- 全局样式入口：`app/globals.css`
- `nanobot` 后端代理接口：`app/api/nanobot/[...path]/route.ts`
- Platform 布局入口：`app/(platform)/layout.tsx`
- 自由体列表页路由入口：`app/(platform)/bots/page.tsx`
- 单自由体 Playground 路由入口：`app/(platform)/bots/[agentId]/page.tsx`
- 默认工作台路由入口：`app/(platform)/workbench/page.tsx`
- 工作台动态路由入口：`app/(platform)/workbench/[agentId]/page.tsx`
- 工作流列表页路由入口：`app/(platform)/workflows/page.tsx`
- 工作流示例详情路由入口：`app/(platform)/workflows/[id]/page.tsx`
- 工具中心路由入口：`app/(platform)/tools/page.tsx`
- 服务中心路由入口：`app/(platform)/services/page.tsx`
- 技能中心路由入口：`app/(platform)/skills/page.tsx`

Platform 页面组件：

- 自由体卡片：`components/bots/bot-card.tsx`
- 新建自由体入口卡片：`components/bots/create-bot-card.tsx`
- 单自由体 Playground 主页面：`components/bots/bot-playground.tsx`
- 会话列表主组件：`components/bots/bot-session-pane.tsx`
- 发送区主组件：`components/bots/bot-composer-pane.tsx`
- 对话记录主组件：`components/bots/bot-transcript-pane.tsx`
- 对话消息 Markdown 渲染组件：`components/bots/bot-message-markdown.tsx`
- 自由体配置区主组件：`components/bots/bot-config-panel.tsx`
- 自由体配置编辑表单：`components/bots/bot-config-edit.tsx`
- 工作台主容器：`components/workbench/workbench-page.tsx`
- 工作台空态页：`components/workbench/workbench-empty-state.tsx`
- 工作台左侧会话侧栏：`components/workbench/workbench-session-sidebar.tsx`
- 移动端工作台会话抽屉：`components/workbench/workbench-session-drawer.tsx`
- 工作台右侧配置抽屉：`components/workbench/workbench-config-drawer.tsx`
- 工作流列表与演示页主组件：`components/workflows/workflow-demo-page.tsx`
- 工作流卡片：`components/workflows/workflow-card.tsx`
- 新建工作流入口卡片：`components/workflows/create-workflow-card.tsx`

Platform 共享与基础组件：

- Platform 统一页面壳：`components/shared/app-shell.tsx`
- Platform 顶部导航：`components/shared/top-nav.tsx`
- 平台卡片页通用外框：`components/shared/card-page-frame.tsx`
- 能力中心通用卡片：`components/shared/capability-card.tsx`
- 页面占位组件：`components/shared/page-placeholder.tsx`
- 基础按钮组件：`components/ui/button.tsx`
- 按钮样式变体定义：`components/ui/button-variants.ts`
- 基础输入框组件：`components/ui/input.tsx`
- 基础标签组件：`components/ui/badge.tsx`

Platform 业务数据与工具：

- 自由体相关 API 封装：`features/bots/api.ts`
- 自由体相关类型定义：`features/bots/types.ts`
- 工作流页面数据：`features/workflows/data.ts`
- 工作流类型定义：`features/workflows/types.ts`
- 工具中心数据：`features/tools/data.ts`
- 工具中心类型定义：`features/tools/types.ts`
- 服务中心数据：`features/services/data.ts`
- 服务中心类型定义：`features/services/types.ts`
- 技能中心数据：`features/skills/data.ts`
- 技能中心类型定义：`features/skills/types.ts`
- 能力卡片共用类型：`features/capabilities/types.ts`
- Platform 导航配置：`lib/nav.ts`
- 通用工具函数：`lib/utils.ts`

## KnowHub 说明

### 1. 功能模块说明

- `overview`：知识域概览页
- `docspace`：文档中心
- `strategies`：策略中心
- `knowledge`：知识库列表、详情与新建弹窗
- `settings/global-strategies`：全局默认策略配置
- `retrieval`：检索占位页

### 2. 文件组织方式

- 命名约定：英文路径、目录、接口统一使用 `docspace`；功能模块中文名称使用“文档中心”；文档中心中的单个实例使用“文档空间”
- `app/knowhub/*`：KnowHub 路由入口层，只做路由承接和参数归一化
- `knowhub/components/*`：KnowHub 页面实现层，按 `overview / docspace / strategies / knowledge / settings / shared` 分组
- `knowhub/features/*`：KnowHub 业务数据、类型、接口封装和服务端逻辑
- `knowhub/components/shared/*`：KnowHub 内部共享导航、工具栏、卡片网格和占位组件
- `app/api/knowhub/*`：KnowHub 文档空间相关接口

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
- 检索页主组件：`knowhub/components/retrieval/retrieval-page.tsx`

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
- 策略分类配色定义：`knowhub/components/strategies/strategy-colors.ts`

KnowHub 知识中心与配置管理：

- 知识中心列表页主组件：`knowhub/components/knowledge/knowledge-page.tsx`
- 知识库卡片：`knowhub/components/knowledge/knowledge-card.tsx`
- 知识库详情页主组件：`knowhub/components/knowledge/knowledge-detail-page.tsx`
- 新建知识库弹窗：`knowhub/components/knowledge/knowledge-builder-dialog.tsx`
- 文件夹域选择弹窗：`knowhub/components/knowledge/file-scope-picker-dialog.tsx`
- 文件夹策略弹窗：`knowhub/components/knowledge/folder-strategy-dialog.tsx`
- 策略阶段编辑组件：`knowhub/components/knowledge/strategy-stage-editor.tsx`
- 全局策略页主组件：`knowhub/components/settings/global-strategy-page.tsx`

KnowHub 业务数据与服务：

- `docspace`：文档中心核心业务域，负责文档空间元数据、连接测试、文件扫描与本地持久化
- 文档空间前端请求封装：`knowhub/features/docspace/api.ts`
- 文档空间服务端业务逻辑：`knowhub/features/docspace/service.ts`
- 文档空间元数据读写：`knowhub/features/docspace/repository.ts`
- 本地持久化与托管目录操作：`knowhub/features/docspace/storage.ts`
- OSS 连接测试与对象读取：`knowhub/features/docspace/oss-connector.ts`
- SMB 连接测试与共享目录读取：`knowhub/features/docspace/smb-connector.ts`
- 文档空间类型定义：`knowhub/features/docspace/types.ts`
- 策略中心数据：`knowhub/features/strategies/data.ts`
- 策略中心类型定义：`knowhub/features/strategies/types.ts`
- 知识中心列表数据：`knowhub/features/knowledge/data.ts`
- 知识中心类型定义：`knowhub/features/knowledge/types.ts`
- 知识库配置弹窗与全局策略页使用的默认策略模板数据：`knowhub/features/knowledge/builder-data.ts`
- 知识库配置与文件夹策略相关类型定义：`knowhub/features/knowledge/builder-types.ts`
- 概览页数据：`knowhub/features/overview/data.ts`
- 概览页类型定义：`knowhub/features/overview/types.ts`

## 开发现状

### Platform

- `bots`：真实后端
- `workbench / workflows / tools / services / skills`：前端原型与静态数据

### KnowHub

- `docspace`：真实后端与本地文件持久化
- `overview`：文档空间数据真实，其余统计静态
- `knowledge`：文档空间数据真实，列表与策略模板静态
- `strategies`：前端原型与静态数据
- `settings/global-strategies`：前端原型与静态模板
- `retrieval`：占位页

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
- Platform 改 `app/(platform)`、`components`、`features`，KnowHub 改 `app/knowhub`、`knowhub/components`、`knowhub/features`。
- 共享层放对位置：Platform 共享放 `components/shared`，KnowHub 私有共享放 `knowhub/components/shared`，基础控件放 `components/ui`。
- KnowHub 保持独立导航、全宽布局、策略中心单一路由和全局策略独立配置入口。

## dev_guide 编写原则

- 只写当前有效状态，不写变更过程、历史路径或“原来是 A、现在改成 B”。
- 目录、文件职责、文件名称、模块边界发生变化时，同步更新本文件，需要检查 `## 当前目录结构` 和对应模块的内容是否要调整。
- 模块说明、边界说明、文件组织方式、开发现状等列表项，优先采用“一行标签式”写法。
- 每个文件说明只写当前职责，不写实现细节、重构原因或临时方案。
- 优先写稳定结构和高频落点，避免记录容易过时的界面细节或临时数据。
