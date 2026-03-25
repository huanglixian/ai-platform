# Ai Platform 开发说明

## 项目定位

- 使用 `Next.js + React` 构建前端原型
- 当前以页面骨架、导航、卡片体系和基础视觉规范为主
- 后续可接 `FastAPI`

## 业务命名

- `portal`：门户
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
│  │  ├─ portal/page.tsx
│  │  ├─ bots/page.tsx
│  │  ├─ workflows/page.tsx
│  │  ├─ tools/page.tsx
│  │  ├─ services/page.tsx
│  │  └─ skills/page.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ bots/
│  │  ├─ bot-card.tsx
│  │  └─ create-bot-card.tsx
│  ├─ shared/
│  │  ├─ app-shell.tsx
│  │  ├─ page-placeholder.tsx
│  │  ├─ section-header.tsx
│  │  └─ top-nav.tsx
│  └─ ui/
│     ├─ badge.tsx
│     ├─ button.tsx
│     └─ input.tsx
├─ features/
│  └─ bots/
│     ├─ data.ts
│     └─ types.ts
├─ lib/
│  ├─ nav.ts
│  └─ utils.ts
└─ dev_guide.md
```

## 组件分层

- `components/ui`
  放无业务语义的基础 UI

- `components/shared`
  放多个页面明确复用的中层组件和站点共享结构

- `components/bots`
  放 `bots` 页面专属组件

## 样式规则

- 全局设计变量统一放在 `app/globals.css`
- 基础 card 外壳统一使用 `.app-card`
- 业务卡片只负责自己的内容结构，不负责定义新的基础外壳规则
- 页面标题统一使用 `SectionHeader`

## 当前页面状态

- `bots` 已有首版卡片列表
- `portal`、`tools`、`services`、`skills`、`workflows` 先保留占位页
- 顶部导航当前按一级/二级结构组织
- `knowledge`、`database`、`orgs`、`roles`、`users` 暂不在当前平台内占位，后续再独立展开

## 开发规则

- 对话、代码、注释统一使用中文
- 优先简单实现，避免过度抽象
- 先确认方案，再做批量改动
- 不保留无用旧实现
- 文档只记录当前有效规则，不记录变更过程
