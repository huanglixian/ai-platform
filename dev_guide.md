# Ai Platform 开发说明

这份文档是给后续要修改这套代码的 AI / 开发者看的。目标不是记录历史，而是快速说明：

- 这是什么项目
- 目录怎么分层
- 遇到需求时应该优先改哪一层
- 哪些结构是当前有效约定，不要随手改回旧形态

## 项目是什么

`Ai Platform` 是一个面向企业级场景的智能体平台前端，负责统一承载智能体工作台、流程编排、知识接入、工具与服务接入等业务入口与交互界面。

当前代码里有两条主线：

- 平台主体（platform）：`bots / workflows / tools / services / skills`
- `KnowHub`：作为平台内接入的知识业务域，已经独立出自己的路由和布局，后续可以继续解耦

## 先理解这几个边界

- `app`
  Next.js App Router 路由层，只放页面入口、布局和 API route

- `app/(platform)`
  平台主体业务页面，走统一平台壳

- `app/knowhub`
  KnowHub 独立路由层，不再挂在平台 `AppShell` 下，使用自己的布局和导航

- `knowhub`
  KnowHub 的业务实现目录
  这里收口页面组装、KnowHub 私有组件、数据、类型

- `components/ui`
  平台主体通用基础 UI，允许被平台主体和 KnowHub 共同复用

- `components/shared`
  平台级共享壳层和公共结构
  不要把 KnowHub 私有组件放进这里

- `knowhub/components/shared`
  KnowHub 内部共享组件
  这层只服务 KnowHub，例如顶部导航、工具栏、占位面板

- `features`
  当前平台主体业务，例如 `bots`

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
│  │  ├─ pipelines/page.tsx
│  │  ├─ knowledge/page.tsx
│  │  └─ retrieval/page.tsx
│  ├─ api/
│  │  └─ nanobot/[...path]/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ bots/
│  ├─ shared/
│  └─ ui/
├─ knowhub/
│  ├─ components/
│  │  ├─ documents/
│  │  ├─ layout/
│  │  ├─ overview/
│  │  ├─ shared/
│  │  └─ strategies/
│  ├─ data/
│  ├─ pages/
│  │  ├─ documents/
│  │  ├─ knowledge/
│  │  ├─ overview/
│  │  ├─ pipelines/
│  │  ├─ retrieval/
│  │  └─ strategies/
│  └─ types/
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
  单自由体工作台

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
  当前通过 `?tab=preprocess | chunking | extract` 切换策略类型

- `/knowhub/pipelines`
  处理中心，占位页

- `/knowhub/knowledge`
  知识中心，占位页

- `/knowhub/retrieval`
  检索页，占位页

## 平台主体当前约定

平台主体仍然是这个仓库的主干，主要承载智能体平台本身的业务页面。`KnowHub` 是平台内接入的独立知识业务域，但不是平台主体的替代物。

### 1. 平台主体统一走 `app/(platform)`

平台主体当前页面都在：

- `app/(platform)/bots`
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
- 平台主体当前走全宽内容区，不做页面级居中限宽
- 卡片列表默认使用固定卡片宽度、自动增列、左对齐的网格方式
- 不要把平台主体需求直接落到 `knowhub/*`
- 除非明确需要跨域复用，否则不要把 KnowHub 私有实现抽回平台 `components/shared`

## KnowHub 当前约定

### 1. 路由层要薄

`app/knowhub/*` 只负责：

- 接住路由
- 做参数归一化
- 调用 `knowhub/pages/*`

不要把 KnowHub 的页面实现直接堆在 `app/knowhub/*` 里。

### 2. KnowHub 有自己的一套共享层

当前这些都属于 KnowHub 内部共享组件：

- [knowhub/components/shared/knowhub-top-nav.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/knowhub-top-nav.tsx)
- [knowhub/components/shared/page-toolbar.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/page-toolbar.tsx)
- [knowhub/components/shared/coming-soon-panel.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/coming-soon-panel.tsx)

不要把它们挪到平台 `components/shared`，除非它们真的已经跨业务域复用。

### 3. `KnowHub` 不再依赖平台 `TopNav`

KnowHub 使用自己的布局和顶部导航：

- [app/knowhub/layout.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/layout.tsx)
- [knowhub/components/shared/knowhub-top-nav.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/knowhub-top-nav.tsx)

KnowHub 当前也走全宽内容区，不再做页面级居中限宽。不要再把 KnowHub 页面挂回平台 `AppShell`。

### 4. 策略中心已经收口

现在只有一个真实入口：

- `/knowhub/strategies`

已经删除旧路由：

- `/knowhub/clean`
- `/knowhub/slices`

当前策略页约定：

- 第一层切换 `预处理策略 / 切片策略 / 提取策略`
- toolbar 第二排标签按当前策略类型下的分类筛选
- 不再使用 `已启用 / 草稿` 这类状态筛选

不要再把策略中心拆回多个一级路由，除非明确要求。

## 需求落地时优先改哪里

### 改 KnowHub 顶部导航

优先看：

- [app/knowhub/layout.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/layout.tsx)
- [knowhub/components/shared/knowhub-top-nav.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/knowhub-top-nav.tsx)

### 改 KnowHub 通用工具栏

优先看：

- [knowhub/components/shared/page-toolbar.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/page-toolbar.tsx)
- [knowhub/components/shared/card-grid.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/card-grid.tsx)

这个组件当前负责：

- 搜索
- 标签筛选
- 可选主按钮
- 可选顶部插槽 `topSlot`

`card-grid.tsx` 当前负责 KnowHub 卡片列表的固定卡片宽度、自动增列和左对齐。

### 改概览页

优先看：

- [app/knowhub/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/page.tsx)
- [knowhub/pages/overview/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/pages/overview/page.tsx)
- [knowhub/components/overview/*](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/overview)
- [knowhub/data/overview.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/data/overview.ts)

### 改文档中心列表页

优先看：

- [app/knowhub/documents/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/documents/page.tsx)
- [knowhub/pages/documents/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/pages/documents/page.tsx)
- [knowhub/components/documents/docspace-card.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/docspace-card.tsx)
- [knowhub/components/documents/docspace-create-dialog.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/docspace-create-dialog.tsx)
- [knowhub/data/docspaces.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/data/docspaces.ts)

### 改文档中心详情页

优先看：

- [app/knowhub/documents/[id]/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/documents/[id]/page.tsx)
- [knowhub/pages/documents/detail-page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/pages/documents/detail-page.tsx)
- [knowhub/components/documents/docspace-file-preview.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/documents/docspace-file-preview.tsx)

### 改策略中心

优先看：

- [app/knowhub/strategies/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/app/knowhub/strategies/page.tsx)
- [knowhub/pages/strategies/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/pages/strategies/page.tsx)
- [knowhub/components/strategies/strategy-colors.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/strategies/strategy-colors.ts)
- [knowhub/components/strategies/strategy-bar.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/strategies/strategy-bar.tsx)
- [knowhub/components/strategies/strategy-card.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/strategies/strategy-card.tsx)
- [knowhub/data/strategies.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/data/strategies.ts)

### 改占位页

优先看：

- [knowhub/pages/pipelines/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/pages/pipelines/page.tsx)
- [knowhub/pages/knowledge/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/pages/knowledge/page.tsx)
- [knowhub/pages/retrieval/page.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/pages/retrieval/page.tsx)
- [knowhub/components/shared/coming-soon-panel.tsx](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/components/shared/coming-soon-panel.tsx)

## 当前数据组织

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

- [knowhub/data/docspaces.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/data/docspaces.ts)
  文档中心的 DocSpace mock 数据

- [knowhub/data/strategies.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/data/strategies.ts)
  策略中心 mock 数据

- [knowhub/data/overview.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/data/overview.ts)
  概览页 mock 数据

- [knowhub/types/index.ts](/Users/huanglixian-m2/Documents/LienCode/ai_platform/knowhub/types/index.ts)
  KnowHub 当前共用类型
  其中策略数据当前使用 `group / metaLabel / metaValue`

## 不要做的事

- 不要打破当前目录边界：平台主体优先走 `app/(platform) + components + features`，KnowHub 优先走 `app/knowhub + knowhub/*`
- 不要把路由层写成实现层，`app/*` 只放页面入口、布局和参数归一化
- 不要把业务私有组件塞进错误的共享层：平台私有不进 `knowhub/components/shared`，KnowHub 私有不进 `components/shared`
- 不要恢复已经废弃的旧路由、旧目录或旧实现，除非明确要求兼容
- 不要为了“将来可能会用”预留无用抽象、兼容代码或多余目录层
- 不要在文档里记录“从什么改成什么”，只保留当前有效结构

## 当前状态

- 平台主体页面已接入：`bots / workflows / tools / services / skills`
- `bots` 已接真实 `nanobot` 后端
- `KnowHub` 已经不是空骨架
- `KnowHub` 当前已有真实页面：
  - 概览
  - 文档中心列表页
  - 文档详情页
  - 策略中心统一页
- `KnowHub` 当前仍处于前端原型重构阶段，`pipelines / knowledge / retrieval` 仍未展开真实业务实现

## 开发规则

- 对话、代码、注释统一使用中文
- 优先简单实现，避免过度抽象
- 先确认方案，再做批量改动
- 不保留无用旧实现
- 文档只记录当前有效规则
