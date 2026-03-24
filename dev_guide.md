# Ai Platform 开发说明

## 1. 项目目标

本项目使用 `Next.js + React` 构建前端原型，后续可能接入 Python `FastAPI`。

第一阶段目标：

- 搭建统一项目骨架
- 定义界面风格和设计 token
- 落地 `bots` 页面
- 组件只抽到“够复用”为止，不做过度设计

当前不做：

- 不提前设计完整后端架构
- 不提前抽象全量业务组件
- 不为了未来可能需求预留复杂扩展点

## 2. 业务命名

统一使用以下业务名称：

- `portal`：门户
- `knowledge`：知识库
- `bots`：自由体
- `workflows`：工作流
- `services`：服务中心
- `skills`：技能中心

代码中不再使用旧命名：

- 不使用 `agents`
- 不使用 `explore`

## 3. 技术路线

已确认技术栈：

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`
- `lucide-react`

路线原则：

- 使用 `App Router`
- 以前端原型优先，数据先用本地 mock
- 后续如需接 `FastAPI`，通过前端请求或中间层逐步接入

## 4. 设计原则

### 4.1 总体原则

- 保持后台产品感，但不要做成传统行政后台
- 优先统一信息层级、间距、卡片骨架
- 页面差异主要来自数据和内容结构，不依赖杂乱样式
- 渐变只用于少数重点区域，不铺满常规卡片

### 4.2 组件抽象原则

当前重点抽象“卡片骨架”，不抽“页面专用卡片”。

优先抽这些层次：

1. 壳层：导航、页面头部、内容容器
2. 筛选层：搜索、筛选、标签、排序
3. 内容层：卡片网格、创建卡片、通用实体卡片
4. 详情层：详情面板、标签页、基础信息块

不做的事情：

- 不提前拆太细的页面专属组件
- 不按未来可能复杂度拆目录
- 不先抽象完整设计系统

## 5. 颜色与风格

### 5.1 已确认基础色

#### 品牌蓝系

- 深色：`#1A4D87`
- 主色：`#0368B3`
- 强调色：`#2E7DD2`
- 辅助色：`#4A83C5`
- 浅色：`#77A2D4`
- 极浅色：`#A5C1E2`

#### 文字色

- 标题：`#0D0D0D`
- 正文：`#262626`
- 次要：`#4D4D4D`
- 提示：`#808080`
- 禁用：`#B3B3B3`

#### 背景色

- 页面底色：`#F5F7FA`
- 浅蓝背景：`#E8EFF8`

### 5.2 补充语义色

为了组件化落地，额外补充以下语义层：

- `surface`：`#FFFFFF`
- `surface-muted`：建议使用 `#F8FAFC`
- `border`：建议使用 `#D8E2EE`

后续还需要补齐状态色：

- `success`
- `warning`
- `danger`
- `info`

### 5.3 渐变原则

- 大色块区域可以使用 `135deg` 对角渐变
- 只在相邻或接近色阶之间做渐变
- 重要色可占更高权重，例如 `30% -> 70%`

适合使用渐变的区域：

- 顶部品牌区域
- hero 区
- 创建入口卡片
- 空状态重点区域

不适合使用渐变的区域：

- 普通信息卡片主体
- 表单主体
- 表格区域
- 大多数列表项

## 6. 布局与视觉规范

建议基础规范如下：

### 6.1 圆角

- 小控件：`8px`
- 常规卡片和输入框：`12px`
- 重点面板：`16px`

### 6.2 阴影

- 默认阴影：轻微层次
- hover / 浮层阴影：更明显，但保持克制

### 6.3 间距

使用 4 的倍数体系：

- `4`
- `8`
- `12`
- `16`
- `20`
- `24`
- `32`

## 7. 项目结构

当前建议结构：

```txt
ai_platform/
├─ app/
│  ├─ (studio)/
│  │  ├─ layout.tsx
│  │  ├─ portal/
│  │  │  └─ page.tsx
│  │  ├─ knowledge/
│  │  │  └─ page.tsx
│  │  ├─ bots/
│  │  │  └─ page.tsx
│  │  ├─ workflows/
│  │  │  └─ page.tsx
│  │  ├─ services/
│  │  │  └─ page.tsx
│  │  └─ skills/
│  │     └─ page.tsx
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ ui/
│  ├─ shell/
│  ├─ cards/
│  └─ bots/
│     ├─ bot-card.tsx
│     ├─ bot-detail-panel.tsx
│     └─ bot-detail-tabs.tsx
├─ features/
│  └─ bots/
│     ├─ types.ts
│     └─ data.ts
├─ lib/
│  ├─ utils.ts
│  ├─ tokens.ts
│  └─ nav.ts
├─ public/
├─ reference/
└─ dev_guide.md
```

目录原则：

- `app/` 放路由页面
- `components/ui/` 放基础 UI 组件
- `components/shell/` 放站点壳层
- `components/cards/` 放跨页面卡片骨架
- `components/bots/` 放 `bots` 页专属组件
- `features/bots/` 放 `bots` 页 mock 数据和类型
- `lib/` 放 token、导航配置和通用方法

## 8. 第一阶段实施范围

第一阶段只做：

1. 初始化 Next.js 项目
2. 接入 `Tailwind CSS`
3. 接入 `shadcn/ui`
4. 搭建 `(studio)` 壳层
5. 落地 `bots` 页面首版
6. 其他页面先保留占位页

## 9. bots 页面拆分原则

当前只保持最低必要拆分：

```txt
components/bots/
├─ bot-card.tsx
├─ bot-detail-panel.tsx
└─ bot-detail-tabs.tsx
```

说明：

- 不提前拆 `overview`、`knowledge`、`memory` 等多个文件
- 当某个区域已经明显独立、或者单文件过大时，再继续拆分
- 先保证结构清晰，再考虑进一步细化

## 10. 开发约束

- 与用户对话、代码、注释统一使用中文
- 优先使用简单实现
- 不保留旧实现，除非明确要求兼容
- 不写说明性冗余代码
- 先保证骨架统一，再处理个别页面差异
