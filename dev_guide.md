# Ai Platform 开发说明

## 项目介绍

`Ai Platform` 是一个面向企业级场景的智能体平台，围绕智能体工作台、流程编排、知识接入、工具与服务接入等能力，提供统一的业务入口与交互界面。当前平台主体聚焦智能体平台本身，`KnowHub` 作为平台内接入的知识业务域演进，后续可按独立子系统逐步解耦。

## 模块边界

- `app`
  平台主体路由层，是智能体平台的主要部分

- `app/(platform)`
  当前统一平台壳下的业务页面入口

- `app/(platform)/knowhub`
  KnowHub 路由入口层，只放知识业务相关页面的薄入口

- `knowhub`
  KnowHub 业务域实现目录
  后续页面组装、专属组件和业务逻辑都收口在这里，便于后续独立解耦

- `components/ui`
  平台共享的基础 UI 组件

- `components/shared`
  平台共享壳层和公共结构
  不承载 KnowHub 私有业务组件

- `features`
  当前平台主体业务的数据定义、页面数据和接口封装
  现阶段继续服务 `bots`、`workflows`、`tools`、`services`、`skills`

- `lib`
  平台级工具函数和导航配置

## 导航分组与业务命名

- 工作台
  平台默认入口，当前默认进入 `main` 自由体工作台

- 智能体
  - `bots`：自由体
  - `workflows`：工作流

- 数据中心
  - `知识库`：KnowHub，知识接入、处理、检索与发布
  - `数据库`：DataHub，结构化数据接入、清洗与管理，暂未展开

- 能力中心
  - `tools`：工具中心
  - `services`：服务中心
  - `skills`：技能中心

- 配置管理
  - `orgs`：组织管理
  - `roles`：角色管理
  - `users`：用户管理

不再使用旧命名：

- `agents`
- `explore`

## 当前目录

```txt
Ai_Platform/
├─ app/
│  ├─ (platform)/
│  │  ├─ layout.tsx
│  │  ├─ bots/
│  │  │  ├─ page.tsx
│  │  │  └─ [agentId]/page.tsx
│  │  ├─ knowhub/
│  │  │  ├─ page.tsx
│  │  │  ├─ documents/page.tsx
│  │  │  ├─ strategies/page.tsx
│  │  │  ├─ pipelines/page.tsx
│  │  │  ├─ knowledge/page.tsx
│  │  │  └─ retrieval/page.tsx
│  │  ├─ workflows/page.tsx
│  │  ├─ tools/page.tsx
│  │  ├─ services/page.tsx
│  │  └─ skills/page.tsx
│  ├─ api/
│  │  └─ nanobot/[...path]/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ bots/
│  ├─ workflows/
│  ├─ shared/
│  └─ ui/
├─ knowhub/
│  ├─ pages/
│  ├─ components/
│  ├─ lib/
│  ├─ data/
│  └─ types/
├─ features/
│  ├─ bots/
│  ├─ workflows/
│  ├─ tools/
│  ├─ services/
│  └─ skills/
├─ lib/
│  ├─ nav.ts
│  └─ utils.ts
└─ dev_guide.md
```

## 页面职责

- `/`
  平台默认入口，默认重定向到 `main` 自由体工作台

- `bots/page.tsx`
  自由体列表页，展示摘要信息和创建入口

- `bots/[agentId]/page.tsx`
  单自由体工作台，负责聊天、会话和配置区编辑

- `workflows/page.tsx`
  工作流列表页

- `knowhub/page.tsx`
  KnowHub 概览页入口

- `knowhub/documents`
  文档中心入口

- `knowhub/strategies`
  策略中心入口

- `knowhub/pipelines`
  处理中心入口

- `knowhub/knowledge`
  知识内容页入口

- `knowhub/retrieval`
  检索测试入口

- `tools`、`services`、`skills`
  能力中心卡片列表页

## 组件与实现约定

- `app/(platform)/*`
  只放页面入口和路由层代码

- `knowhub/pages`
  放 KnowHub 页面级组装

- `knowhub/components`
  放 KnowHub 专属组件

- `knowhub/lib`、`knowhub/data`、`knowhub/types`
  放 KnowHub 非页面实现

- `components/ui`
  只放无业务语义的基础 UI

- `components/shared`
  只放平台共享壳层和公共结构

## 前后端边界

- `Ai_Platform` 只负责平台前端和 Next 路由代理
- `bots` 不直接请求 Python 服务地址
- 自由体相关请求统一走 `app/api/nanobot/[...path]/route.ts`
- 外部 `nanobot_web_server` 负责自由体注册、会话、聊天、流式过程和配置区接口等运行时能力
- `Ai_Platform` 内只消费 HTTP API，不承载 `nanobot` 运行时实现

## 当前状态

- 工作台已默认进入 `main` 自由体工作台
- `bots` 已接真实 `nanobot` 后端
- `bots` 列表页负责摘要展示
- `bots` 工作台负责聊天、会话和配置区编辑
- `bots` 工作台聊天已改成工具过程流式显示
- `workflows` 已有首版卡片列表
- `tools`、`services`、`skills` 已有首版能力卡片列表
- `knowhub` 已建立路由骨架和业务目录骨架，后续在该业务域内重构知识相关页面
- `datahub`、`orgs`、`roles`、`users` 暂未在当前平台内展开

## 开发规则

- 对话、代码、注释统一使用中文
- 优先简单实现，避免过度抽象
- 先确认方案，再做批量改动
- 不保留无用旧实现
- 文档只记录当前有效规则，不记录变更过程
