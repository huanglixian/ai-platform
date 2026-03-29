# Ai Platform 开发说明

## 项目定位

- 使用 `Next.js + React` 构建平台前端
- 当前重点是首页工作台、卡片列表、工作台页面和统一视觉规范
- `bots` 已通过 Next 代理接入外部 `nanobot_web_server`
- 后续业务数据逐步向数据库和正式后端收敛

## 业务命名

- `knowledge`：知识库
- `database`：数据库
- `bots`：自由体
- `workflows`：工作流
- `tools`：工具中心
- `services`：服务中心
- `skills`：技能中心
- `orgs`：组织管理
- `roles`：角色管理
- `users`：用户管理

不再使用旧命名：

- `agents`
- `explore`

## 技术栈

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`

## 当前目录

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
│  ├─ api/
│  │  └─ nanobot/[...path]/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ bots/
│  │  ├─ bot-card.tsx
│  │  ├─ bot-composer-pane.tsx
│  │  ├─ bot-config-edit.tsx
│  │  ├─ bot-config-panel.tsx
│  │  ├─ bot-session-pane.tsx
│  │  ├─ bot-transcript-pane.tsx
│  │  ├─ bot-workbench.tsx
│  │  ├─ bots-page-client.tsx
│  │  └─ create-bot-card.tsx
│  ├─ workflows/
│  │  ├─ create-workflow-card.tsx
│  │  └─ workflow-card.tsx
│  ├─ shared/
│  │  ├─ app-shell.tsx
│  │  ├─ capability-card.tsx
│  │  ├─ card-page-frame.tsx
│  │  ├─ page-placeholder.tsx
│  │  └─ top-nav.tsx
│  └─ ui/
│     ├─ badge.tsx
│     ├─ button.tsx
│     └─ input.tsx
├─ features/
│  ├─ bots/
│  │  ├─ api.ts
│  │  └─ types.ts
│  ├─ workflows/
│  │  ├─ data.ts
│  │  └─ types.ts
│  ├─ tools/
│  │  ├─ data.ts
│  │  └─ types.ts
│  ├─ services/
│  │  ├─ data.ts
│  │  └─ types.ts
│  └─ skills/
│     ├─ data.ts
│     └─ types.ts
├─ lib/
│  ├─ nav.ts
│  └─ utils.ts
└─ dev_guide.md
```

## 前后端边界

- `Ai_Platform` 只负责平台前端和 Next 路由代理
- `bots` 不直接请求 Python 服务地址
- 自由体相关请求统一走 `app/api/nanobot/[...path]/route.ts`
- 外部 `nanobot_web_server` 负责自由体注册、session、聊天、流式过程、配置区接口等运行时能力
- `Ai_Platform` 内只消费 HTTP API，不承载 `nanobot` 运行时实现

## 组件分层

- `components/ui`
  放无业务语义的基础 UI

- `components/shared`
  放多个页面共用的中层组件和平台共享结构

- `components/bots`
  放自由体列表页和工作台专属组件
  当前已拆出会话栏、发送区、对话记录、配置区摘要面板和编辑弹层

- `components/workflows`
  放工作流页面专属组件

- `features/bots`
  放自由体 API 封装、流式解析和类型定义

- `features/workflows`
  放工作流页面数据和类型定义

- `features/tools`、`features/services`、`features/skills`
  放能力中心页面数据和类型定义

## 页面职责

- `/`
  平台首页，默认进入 `main` 自由体工作台

- `bots/page.tsx`
  自由体列表页，展示摘要信息和创建入口

- `bots/[agentId]/page.tsx`
  单自由体工作台，负责聊天、session、配置区编辑

- `workflows/page.tsx`
  工作流列表页，沿用平台卡片式版式

- `tools`、`services`、`skills`
  能力中心卡片列表页

## 样式规则

- 全局设计变量统一放在 `app/globals.css`
- 基础 card 外壳统一使用 `.app-card`
- 业务卡片只负责内容结构，不重复定义基础 card 外壳
- 卡片页公共骨架统一使用 `CardPageFrame`
- 能力中心卡片骨架统一使用 `CapabilityCard`
- `CardPageFrame` 现在是 `Client Component`
- `bots` 工作台优先固定在视口内，滚动条放在各自 panel 内部

## 当前页面状态

- 首页
  已默认进入 `main` 自由体工作台
- `bots`
  已接真实 `nanobot` 后端
- `bots` 列表页负责摘要展示
- `bots` 工作台负责聊天、session 和配置区编辑
- `bots` 工作台聊天已改成工具过程流式显示
- `bots` 工作台右侧已从名单配置改成配置区
- `workflows`
  已有首版卡片列表
- `tools`、`services`、`skills`
  已有首版能力卡片列表
- 顶部导航按一级/二级结构组织
- `knowledge`、`database`、`orgs`、`roles`、`users`
  暂不在当前平台内展开

## 开发规则

- 对话、代码、注释统一使用中文
- 优先简单实现，避免过度抽象
- 先确认方案，再做批量改动
- 不保留无用旧实现
- 文档只记录当前有效规则，不记录变更过程

## bots 工作台说明

- 发送消息区只负责输入和状态提示
- 工具调用过程通过流式状态显示在发送区底部
- 最终答案只在对话记录区统一显示
- 左侧会话列表支持切换当前会话和查看轮次导航
- `bot-workbench.tsx` 负责工作台级状态、数据加载和各面板编排
- 会话栏、发送区、对话记录已拆成独立 pane 组件
- 右侧配置区当前包含：
  - 配置文件
  - 写入白名单
  - 读取黑名单
- 配置项默认显示摘要，点击后通过弹层编辑
