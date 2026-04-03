# Ai Platform 开发说明

这份文档是给后续要修改这套代码的 AI / 开发者看的。目标不是记录历史，而是快速说明：

- 这是什么项目
- 目录怎么分层
- 哪些结构是有效约定

## 项目是什么

`Ai Platform` 是一个面向企业级场景的智能体平台前端，负责统一承载智能体工作台、流程编排、知识接入、工具与服务接入等业务入口与交互界面。

当前代码里有两条主线：

- 平台主体（platform）：`bots / workflows / tools / services / skills`
- `KnowHub`：平台内的知识业务域，使用独立路由和布局

## 先理解这几个边界

- `app`
  Next.js App Router 路由层，只放页面入口、布局和 API route

- `app/(platform)`
  平台主体业务页面，走统一平台壳

- `app/knowhub`
  KnowHub 独立路由层，使用自己的布局和导航

- `knowhub`
  KnowHub 的业务实现目录
  这里承载页面实现、KnowHub 私有组件、业务数据、类型与接口封装

- `components/ui`
  平台主体通用基础 UI，允许被平台主体和 KnowHub 共同复用

- `components/shared`
  平台级共享壳层和公共结构
  不要把 KnowHub 私有组件放进这里

- `knowhub/components/shared`
  KnowHub 内部共享组件
  这层只服务 KnowHub，例如顶部导航、工具栏、占位面板

- `features`
  平台主体业务，例如 `bots`

- `lib`
  平台级工具函数、导航配置等

## 当前目录结构

```txt
Ai_Platform/
├─ app/
│  ├─ (platform)/
│  │  ├─ layout.tsx
│  │  ├─ bots/
│  │  │  ├─ page.tsx
│  │  │  └─ [agentId]/page.tsx
│  │  ├─ workbench/
│  │  │  ├─ page.tsx
│  │  │  └─ [agentId]/page.tsx
│  │  ├─ workflows/page.tsx
│  │  ├─ tools/page.tsx
│  │  ├─ services/page.tsx
│  │  └─ skills/page.tsx
│  ├─ knowhub/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  ├─ documents/
│  │  │  ├─ page.tsx
│  │  │  └─ [id]/page.tsx
│  │  ├─ strategies/page.tsx
│  │  ├─ knowledge/
│  │  │  ├─ page.tsx
│  │  │  └─ [id]/page.tsx
│  │  └─ retrieval/page.tsx
│  ├─ api/
│  │  └─ nanobot/[...path]/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ bots/
│  ├─ workbench/
│  ├─ shared/
│  └─ ui/
├─ knowhub/
│  ├─ components/
│  │  ├─ documents/
│  │  ├─ layout/
│  │  ├─ knowledge/
│  │  ├─ overview/
│  │  ├─ retrieval/
│  │  ├─ shared/
│  │  └─ strategies/
│  └─ features/
│     ├─ docspaces/
│     ├─ knowledge/
│     ├─ overview/
│     └─ strategies/
├─ features/
├─ lib/
└─ dev_guide.md
```

## 当前有效路由

- `/`
  平台默认入口

- `/bots`
  自由体列表页

- `/bots/[agentId]`
  单自由体 Playground

- `/workbench`
  默认用户工作台入口，当前默认进入 `main`

- `/workbench/[agentId]`
  面向用户的工作台页面

- `/workflows`
  工作流列表页

- `/tools` `/services` `/skills`
  平台能力中心页面

- `/knowhub`
  KnowHub 概览页

- `/knowhub/documents`
  文档中心列表页

- `/knowhub/documents/[id]`
  单个 DocSpace 详情页

- `/knowhub/strategies`
  策略中心统一入口
  通过 `?tab=preprocess | chunking | extract` 切换策略类型

- `/knowhub/knowledge`
  知识中心入口，承载任务编排与已发布知识成果

- `/knowhub/retrieval`
  检索页，占位页

## 平台主体当前约定

平台主体仍然是这个仓库的主干，主要承载智能体平台本身的业务页面。`KnowHub` 是平台内接入的独立知识业务域，但不是平台主体的替代物。

### 1. 平台主体统一走 `app/(platform)`

平台主体当前页面都在：

- `app/(platform)/bots`
- `app/(platform)/workbench`
- `app/(platform)/workflows`
- `app/(platform)/tools`
- `app/(platform)/services`
- `app/(platform)/skills`

这些页面统一由：

- [app/(platform)/layout.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/(platform)/layout.tsx)
- [components/shared/app-shell.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/shared/app-shell.tsx)

提供平台级外壳。

不要把平台主体页面挪到 `app/knowhub`，也不要把平台页面直接改成 KnowHub 的布局方式。

### 2. 平台主体依赖统一导航壳

平台主体顶部导航来自：

- [components/shared/top-nav.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/shared/top-nav.tsx)
- [lib/nav.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/lib/nav.ts)

当前一级导航结构是：

- 工作台
- 能力中心
- 数据中心
- 工作流
- 配置管理

当前二级归属是：

- 工作台
  对应 `/workbench`

- 能力中心
  包含 `工具中心 / 服务中心 / 技能中心`

- 数据中心
  包含 `知识库`

- 工作流
  对应 `/workflows`

- 配置管理
  第一项是 `自由体设置`，对应 `/bots`

如果需求涉及：

- 平台一级导航分组
- 数据中心 / 能力中心 / 配置管理菜单
- 顶部导航展示逻辑

优先改这里，不要去改 KnowHub 自己的导航组件。

### 3. 平台主体的页面实现主要分三层

- `app/(platform)/*`
  路由入口层
  应尽量保持薄，只负责接住页面

- `components/*`
  页面组件层
  例如：
  - `components/bots/*`
  - `components/workbench/*`
  - `components/workflows/*`
  - `components/shared/*`

- `features/*`
  业务数据、类型、接口封装
  例如：
  - `features/bots/api.ts`
  - `features/bots/types.ts`
  - `features/workflows/data.ts`
  - `features/tools/data.ts`
  - `features/services/data.ts`
  - `features/skills/data.ts`

如果需求属于平台主体，默认优先在这三层里找落点。

### 4. 平台主体改动时的默认原则

- 如果需求属于自由体、工作流、工具、服务、技能等平台能力，优先从 `app/(platform)`、`components/*`、`features/*` 里找入口
- 平台主体共享壳优先放 `components/shared`
- 平台基础控件优先放 `components/ui`
- 平台主体走全宽内容区，不做页面级居中限宽
- 卡片列表默认使用固定卡片宽度、自动增列、左对齐的网格方式
- 不要把平台主体需求直接落到 `knowhub/*`
- 除非明确需要跨域复用，否则不要把 KnowHub 私有实现抽回平台 `components/shared`

### 5. `bots` 和 `workbench` 的职责已经分开

- [app/(platform)/bots/[agentId]/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/(platform)/bots/[agentId]/page.tsx)
  对应单自由体 Playground 路由入口

- [components/bots/bot-playground.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/bots/bot-playground.tsx)
  自由体 Playground 主页面，包含会话列表、发送区、对话记录、配置区

- [app/(platform)/workbench/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/(platform)/workbench/page.tsx)
  默认工作台入口，当前默认使用 `main`

- [app/(platform)/workbench/[agentId]/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/(platform)/workbench/[agentId]/page.tsx)
  工作台动态路由入口

- [components/workbench/workbench-page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/workbench/workbench-page.tsx)
  工作台主容器，负责空态、会话态、左侧会话栏和配置抽屉

- [components/workbench/workbench-empty-state.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/workbench/workbench-empty-state.tsx)
  工作台空态页，中部启动输入区

- [components/workbench/workbench-session-sidebar.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/workbench/workbench-session-sidebar.tsx)
  工作台左侧可折叠会话侧栏

- [components/workbench/workbench-config-drawer.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/workbench/workbench-config-drawer.tsx)
  工作台右侧配置抽屉容器

- [components/bots/bot-message-markdown.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/bots/bot-message-markdown.tsx)
  对话消息 Markdown 渲染组件，负责链接跳转和基础 Markdown 显示

- [components/bots/bot-session-pane.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/bots/bot-session-pane.tsx)
  会话列表主组件，同时服务 Playground 和 Workbench；当前支持 `noHover` 模式

- [components/bots/bot-composer-pane.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/bots/bot-composer-pane.tsx)
  发送区主组件，同时服务 Playground 和 Workbench；当前支持 `title / placeholder / footerActions / noHover`

- [components/bots/bot-transcript-pane.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/bots/bot-transcript-pane.tsx)
  对话记录主组件，当前消息内容走 Markdown 渲染

- [components/bots/bot-config-panel.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/components/bots/bot-config-panel.tsx)
  配置区主组件，同时服务 Playground 和 Workbench 配置抽屉；当前支持 `noHover`

- [app/globals.css](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/globals.css)
  平台全局样式入口，当前包含 `app-card / app-card-no-hover / bot-markdown`

## KnowHub 约定

### 1. 路由层要薄

`app/knowhub/*` 只负责：

- 接住路由
- 做参数归一化
- 调用 `knowhub/components/*`

不要把 KnowHub 的页面实现直接堆在 `app/knowhub/*` 里。

### 2. KnowHub 页面实现对齐平台主体

KnowHub 按和平台主体一致的思路分层：

- `app/knowhub/*`
  路由入口层

- `knowhub/components/*`
  页面实现层
  例如：
  - `knowhub/components/documents/documents-page.tsx`
  - `knowhub/components/knowledge/knowledge-page.tsx`
  - `knowhub/components/overview/overview-page.tsx`

- `knowhub/features/*`
  业务数据、类型、接口封装
  例如：
  - `knowhub/features/docspaces/api.ts`
  - `knowhub/features/docspaces/service.ts`
  - `knowhub/features/docspaces/types.ts`
  - `knowhub/features/strategies/data.ts`
  - `knowhub/features/knowledge/data.ts`

### 3. KnowHub 有自己的一套共享层

当前这些都属于 KnowHub 内部共享组件：

- [knowhub/components/shared/knowhub-top-nav.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/knowhub-top-nav.tsx)
- [knowhub/components/shared/page-toolbar.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/page-toolbar.tsx)
- [knowhub/components/shared/coming-soon-panel.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/coming-soon-panel.tsx)

不要把它们挪到平台 `components/shared`，除非它们已经成为跨业务域共享组件。

### 4. `KnowHub` 使用独立导航

KnowHub 使用自己的布局和顶部导航：

- [app/knowhub/layout.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/layout.tsx)
- [knowhub/components/shared/knowhub-top-nav.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/knowhub-top-nav.tsx)

KnowHub 也走全宽内容区，不做页面级居中限宽。

### 5. 策略中心入口与筛选

策略中心只有一个入口：

- `/knowhub/strategies`

当前策略页约定：

- 第一层切换 `预处理策略 / 切片策略 / 提取策略`
- toolbar 第二排标签按当前策略类型下的分类筛选
- 不使用 `已启用 / 草稿` 这类状态筛选

策略中心使用单一路由入口，除非明确要求，不拆分多个一级路由。

## 数据组织

### 平台主体数据组织

- [features/bots/api.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/bots/api.ts)
  自由体相关 API 封装

- [features/bots/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/bots/types.ts)
  自由体相关类型定义

- [features/workflows/data.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/workflows/data.ts)
  工作流页面 mock 数据

- [features/workflows/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/workflows/types.ts)
  工作流类型定义

- [features/tools/data.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/tools/data.ts)
  工具中心页面 mock 数据

- [features/tools/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/tools/types.ts)
  工具中心类型定义

- [features/services/data.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/services/data.ts)
  服务中心页面 mock 数据

- [features/services/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/services/types.ts)
  服务中心类型定义

- [features/skills/data.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/skills/data.ts)
  技能中心页面 mock 数据

- [features/skills/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/skills/types.ts)
  技能中心类型定义

- [features/capabilities/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/features/capabilities/types.ts)
  能力卡片相关共用类型

### KnowHub 数据组织

- [app/knowhub/layout.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/layout.tsx)
  KnowHub 独立布局入口，承载导航与页面壳

- [app/knowhub/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/page.tsx)
  KnowHub 概览页路由入口

- [app/knowhub/documents/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/documents/page.tsx)
  文档中心列表页路由入口

- [app/knowhub/documents/[id]/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/documents/[id]/page.tsx)
  单个 DocSpace 详情页路由入口

- [app/api/knowhub/docspaces/route.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/api/knowhub/docspaces/route.ts)
  文档空间列表读取与创建接口

- [app/api/knowhub/docspaces/[id]/route.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/api/knowhub/docspaces/[id]/route.ts)
  单个文档空间详情读取与删除接口

- [app/api/knowhub/docspaces/[id]/files/route.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/api/knowhub/docspaces/[id]/files/route.ts)
  文档空间文件列表接口

- [app/api/knowhub/docspaces/[id]/sync/route.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/api/knowhub/docspaces/[id]/sync/route.ts)
  文档空间手动同步接口

- [app/api/knowhub/docspaces/[id]/upload/route.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/api/knowhub/docspaces/[id]/upload/route.ts)
  本地空间文件上传接口

- [app/api/knowhub/docspaces/test-connection/route.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/api/knowhub/docspaces/test-connection/route.ts)
  OSS / SMB 测试连接接口

- [knowhub/components/shared/knowhub-top-nav.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/knowhub-top-nav.tsx)
  KnowHub 顶部导航

- [knowhub/components/shared/page-toolbar.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/page-toolbar.tsx)
  KnowHub 列表页通用工具栏，承载搜索、标签和主按钮

- [knowhub/components/shared/card-grid.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/card-grid.tsx)
  KnowHub 卡片网格布局

- [knowhub/components/overview/overview-page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/overview/overview-page.tsx)
  概览页页面实现

- [knowhub/components/documents/documents-page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/documents-page.tsx)
  文档中心列表页页面实现

- [knowhub/components/documents/docspace-card.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/docspace-card.tsx)
  文档空间卡片

- [knowhub/components/documents/docspace-create-dialog.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/docspace-create-dialog.tsx)
  文档空间创建弹窗，支持本地空间、OSS 和 SMB

- [knowhub/components/documents/document-detail-page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/document-detail-page.tsx)
  文档空间详情页页面实现

- [knowhub/components/documents/docspace-file-preview.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/docspace-file-preview.tsx)
  文档空间文件浏览区，支持目录层级切换与空空间上传区

- [knowhub/components/documents/docspace-upload-control.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/docspace-upload-control.tsx)
  本地空间上传控件，支持点击上传与拖拽上传

- [knowhub/components/documents/docspace-sync-control.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/docspace-sync-control.tsx)
  远程来源同步控件

- [knowhub/components/documents/docspace-delete-button.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/docspace-delete-button.tsx)
  文档空间删除控件

- [knowhub/features/docspaces/api.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/docspaces/api.ts)
  文档中心前端请求封装

- [knowhub/features/docspaces/service.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/docspaces/service.ts)
  文档中心服务端业务逻辑

- [knowhub/features/docspaces/repository.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/docspaces/repository.ts)
  文档空间元数据读写

- [knowhub/features/docspaces/storage.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/docspaces/storage.ts)
  本地持久化与托管目录操作

- [knowhub/features/docspaces/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/docspaces/types.ts)
  文档中心类型定义

- [knowhub/features/docspaces/oss-connector.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/docspaces/oss-connector.ts)
  OSS 连接测试与对象列表读取

- [knowhub/features/docspaces/smb-connector.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/docspaces/smb-connector.ts)
  SMB 连接测试与共享目录读取

- [knowhub/features/strategies/data.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/strategies/data.ts)
  策略中心数据

- [knowhub/features/strategies/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/strategies/types.ts)
  策略中心类型定义

- [knowhub/features/knowledge/data.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/knowledge/data.ts)
  知识中心任务与已发布成果数据

- [knowhub/features/knowledge/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/knowledge/types.ts)
  知识中心类型定义

- [knowhub/features/overview/data.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/overview/data.ts)
  概览页数据

- [knowhub/features/overview/types.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/features/overview/types.ts)
  概览页类型定义

## 开发现状

- 平台主体页面已接入：`bots / workflows / tools / services / skills`
- `bots` 已接真实 `nanobot` 后端
- `KnowHub` 文档中心已接真实后端：
  - 文档空间列表与详情走 `/api/knowhub/docspaces/*`
  - 文档空间数据持久化到本地 `storage/knowhub/docspaces`
  - 来源类型支持 `本地空间 / OSS / SMB`
  - 本地空间支持多文件上传与拖拽上传
  - OSS / SMB 支持测试连接与手动同步
  - 文档空间支持删除
  - 详情页支持文件浏览与目录层级切换
- `KnowHub` 概览页与知识中心中的 `DocSpace` 信息读取真实文档空间数据
- `KnowHub` 策略中心、知识任务数据、概览中的非 `DocSpace` 统计仍使用静态数据
- `retrieval` 当前为占位页

## 不要做的事

- 不要打破当前目录边界：平台主体优先走 `app/(platform) + components + features`，KnowHub 优先走 `app/knowhub + knowhub/*`
- 不要把路由层写成实现层，`app/*` 只放页面入口、布局和参数归一化
- 不要把业务私有组件塞进错误的共享层：平台私有不进 `knowhub/components/shared`，KnowHub 私有不进 `components/shared`
- 不要为了“将来可能会用”预留无用抽象、兼容代码或多余目录层
- 不要在文档里记录“从什么改成什么”，只保留当前有效结构

## 开发规则

- 对话、代码、注释统一使用中文
- 优先简单实现，避免过度抽象
- 先确认方案，再做批量改动
- 不保留无用旧实现
- 文档只记录当前有效规则
