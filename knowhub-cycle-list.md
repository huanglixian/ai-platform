# KnowHub 闭环实施 Checklist

## 目标

在当前仓库内按既有 `KnowHub` 分层，跑通以下最小闭环：

1. 文档空间中的 Markdown 文件可读取原文
2. 策略中心注册并配置 `Markdown 标题段落切片` 策略
3. 策略卡片可打开详情，调整参数并上传文件测试预览
4. 知识库可绑定该策略预设并触发建库
5. 建库流程可切片、向量化、写入向量库
6. 可通过最小检索接口验证入库结果

---

## 已确认决策

- 向量库第一版使用 `SQLite + sqlite-vec`
- 代码层必须抽象 `VectorStoreAdapter`，后续 100% 允许替换
- 第一阶段仅重点支持 `.md` 文件
- 切片策略先接入 `reference/obsidian_search` 的 Markdown 切片思路
- 当前以跑通闭环为第一目标，不提前扩展 PDF / Word / Excel 的真实建库链路

---

## 不允许偏离的实现边界

后续实现必须遵守以下边界，避免中途换方案：

- `app/knowhub/*` 只做路由承接和参数归一化
- `app/api/knowhub/*` 放接口入口
- `knowhub/components/*` 放页面和交互组件
- `knowhub/features/*` 放业务逻辑、类型、持久化、执行器
- 向量库实现必须放在 `knowhub/features/vector-store/*`
- 切片策略执行器必须放在 `knowhub/features/strategies/executors/*`
- 策略模板注册必须集中在 `knowhub/features/strategies/registry.ts`
- 不允许把真实执行逻辑继续写回静态 `data.ts`
- 不允许在页面组件里直接写文件读取、切片、向量入库逻辑

---

## 技术方案固定说明

### 向量库方案

- 当前实现：`SQLite + sqlite-vec`
- 后续替换目标：`PostgreSQL + pgvector` 或其他向量库
- 当前代码必须通过统一适配层访问向量库

### 适配层要求

必须提供统一接口，避免未来替换时改业务层：

- `init`
- `upsertSlices`
- `deleteByKnowledgeId`
- `deleteBySourceKeys`
- `searchByEmbedding`
- `getKnowledgeStats`

### 切片策略要求

本轮固定实现一个真实策略：

- 策略模板 ID：`markdown-obsidian-slicer`
- 策略分类：`chunking`
- 预设参数先支持：
  - `headingLevels`
  - `maxTokens`
  - `includeFrontmatter`

---

## 阶段总览

| 阶段 | 名称 | 状态 | 说明 |
| --- | --- | --- | --- |
| 1 | 文档读取能力 | 已完成 | `docspace` 已可统一读取 `.md` 原文 |
| 2 | 策略模板与执行器 | 已完成 | 已注册真实模板、默认预设、执行器与服务层 |
| 3 | 策略中心交互 | 已完成 | 已支持详情抽屉、参数编辑、预设保存、文件测试 |
| 4 | 知识库真实持久化 | 已完成 | 已切换到真实 JSON 存储与 API |
| 5 | 建库流水线 | 已完成 | 已接入 SQLite + sqlite-vec 和最小建库运行链路 |
| 6 | 检索验证 | 未开始 | 用最小查询接口验证闭环 |
| 7 | 收尾与文档 | 未开始 | 补充验证、风险和后续替换说明 |

---

## 阶段 1：文档读取能力

### 目标

为 `hosted / oss / smb` 三种文档空间提供统一原文读取能力，第一阶段重点确保 `.md` 可读。

### 必做项

- [x] 定义统一文件读取返回结构
- [x] 新增本地空间文件读取实现
- [x] 新增 OSS 文件读取实现
- [x] 新增 SMB 文件读取实现
- [x] 在 `docspace service` 暴露统一读取方法
- [x] 约束只在服务端读取文件内容

### 计划新增文件

- [x] `knowhub/features/docspace/file-reader.ts`

### 计划修改文件

- [x] `knowhub/features/docspace/service.ts`
- [x] `knowhub/features/docspace/oss-connector.ts`
- [x] `knowhub/features/docspace/smb-connector.ts`
- [x] `knowhub/features/docspace/types.ts`

### 完成标准

- 给定 `docspaceId + filePath` 能拿到 Markdown 原文
- 失败时返回清晰错误
- 页面层不直接访问 OSS / SMB SDK

---

## 阶段 2：策略模板与执行器

### 目标

把 `reference/obsidian_search` 的 Markdown 切片方式，转成策略中心里的真实策略模板和执行器。

### 必做项

- [x] 设计策略模板类型
- [x] 设计策略预设类型
- [x] 设计测试结果类型
- [x] 新增策略注册中心
- [x] 实现 `markdown-obsidian-slicer` 执行器
- [x] 保留切片元数据：标题链、行号范围、切片类型
- [x] 提供策略测试服务端入口

### 计划新增文件

- [x] `knowhub/features/strategies/registry.ts`
- [x] `knowhub/features/strategies/preset-repository.ts`
- [x] `knowhub/features/strategies/preset-storage.ts`
- [x] `knowhub/features/strategies/executors/markdown-obsidian-slicer.ts`
- [x] `knowhub/features/strategies/service.ts`

### 计划修改文件

- [x] `knowhub/features/strategies/types.ts`
- [x] `knowhub/features/strategies/data.ts`

### 完成标准

- 策略不再只是静态展示数据
- 服务端可基于预设参数返回切片结果
- 切片逻辑不依赖页面组件

---

## 阶段 3：策略中心交互

### 目标

让策略卡片通过统一模板注册接入详情抽屉，支持参数编辑、保存预设、上传文件测试预览。

### 必做项

- [x] 策略卡片支持点击进入详情
- [x] 新增统一策略详情抽屉
- [x] 新增参数表单渲染
- [x] 新增测试面板
- [x] 支持上传 `.md` 文件做切片预览
- [x] 支持保存预设

### 计划新增文件

- [x] `knowhub/components/strategies/strategy-detail-drawer.tsx`
- [x] `knowhub/components/strategies/strategy-settings-form.tsx`
- [x] `knowhub/components/strategies/strategy-test-panel.tsx`
- [x] `app/api/knowhub/strategies/test/route.ts`
- [x] `app/api/knowhub/strategies/presets/route.ts`
- [x] `app/api/knowhub/strategies/presets/[id]/route.ts`

### 计划修改文件

- [x] `knowhub/components/strategies/strategies-page.tsx`
- [x] `knowhub/components/strategies/strategy-card.tsx`

### 完成标准

- 点开策略卡片可以看到真实参数
- 可直接测试并看到切片预览
- 预设保存后可被知识库构建器引用

---

## 阶段 4：知识库真实持久化

### 目标

把当前知识中心从静态草稿记录改成真实可持久化的知识库记录和运行记录。

### 必做项

- [x] 定义知识库记录类型
- [x] 定义建库运行记录类型
- [x] 定义策略预设绑定结构
- [x] 新增知识库存储
- [x] 新增知识库服务层
- [x] 新建知识库接口
- [x] 读取知识库列表和详情改走真实数据

### 计划新增文件

- [x] `knowhub/features/knowledge/repository.ts`
- [x] `knowhub/features/knowledge/storage.ts`
- [x] `knowhub/features/knowledge/service.ts`
- [x] `app/api/knowhub/knowledge/route.ts`
- [x] `app/api/knowhub/knowledge/[id]/route.ts`

### 计划修改文件

- [x] `knowhub/features/knowledge/types.ts`
- [x] `knowhub/features/knowledge/data.ts`
- [x] `knowhub/features/knowledge/builder-types.ts`
- [x] `knowhub/features/knowledge/builder-data.ts`
- [x] `knowhub/components/knowledge/knowledge-page.tsx`
- [x] `knowhub/components/knowledge/knowledge-detail-page.tsx`
- [x] `knowhub/components/knowledge/knowledge-builder-dialog.tsx`

### 计划新增持久化文件

- [x] `storage/knowhub/knowledge/store.json`
- [x] `storage/knowhub/knowledge/runs.json`

### 完成标准

- 新建知识库不再只停留在前端内存
- 知识库能绑定真实策略预设
- 页面刷新后数据仍在

---

## 阶段 5：建库流水线

### 目标

跑通 `读取文件 -> 切片 -> 向量化 -> 向量入库 -> 保存运行记录`。

### 必做项

- [x] 抽象向量库适配层接口
- [x] 接入 SQLite 数据文件
- [x] 初始化 `sqlite-vec`
- [x] 建立切片记录与向量记录写入逻辑
- [x] 建立知识库运行流程
- [ ] 记录文件哈希与切片索引（留到后续增量建库）
- [x] 支持首版全量建库

### 计划新增文件

- [x] `knowhub/features/vector-store/types.ts`
- [x] `knowhub/features/vector-store/sqlite-vec-store.ts`
- [x] `knowhub/features/vector-store/index.ts`
- [x] `knowhub/features/knowledge/build-service.ts`
- [x] `app/api/knowhub/knowledge/[id]/run/route.ts`

### 计划修改文件

- [x] `knowhub/features/knowledge/service.ts`
- [x] `knowhub/features/knowledge/types.ts`

### 计划新增持久化文件

- [x] `storage/knowhub/vector/knowhub.sqlite`

### 完成标准

- 选择知识库后可触发一次真实建库
- `.md` 文件可切片后入向量库
- 运行记录里能看到文件数、切片数、状态

---

## 阶段 6：检索验证

### 目标

通过最小检索接口验证向量入库结果是可用的。

### 必做项

- [ ] 提供 query embedding 调用
- [ ] 提供按知识库检索接口
- [ ] 返回相似度和切片元数据
- [ ] 最小接入检索页或调试接口

### 计划新增文件

- [ ] `app/api/knowhub/retrieval/search/route.ts`
- [ ] `knowhub/features/retrieval/service.ts`

### 计划修改文件

- [ ] `knowhub/components/retrieval/retrieval-page.tsx`

### 完成标准

- 输入查询后能返回命中切片
- 返回结果包含知识库、文件路径、标题链、行号范围

---

## 阶段 7：收尾与文档

### 目标

补全验证、风险记录和后续替换说明，方便后续继续推进。

### 必做项

- [ ] 整理 `sqlite-vec` 当前限制
- [ ] 明确未来替换到 `pgvector` 时只改哪些文件
- [ ] 补充手工验证步骤
- [ ] 更新本文件状态与备注

### 计划修改文件

- [ ] `knowhub-cycle-list.md`

### 完成标准

- 后续接手者能按本文件继续推进
- 不需要重新理解整体方案

---

## 向量库替换边界

后续如果替换 `SQLite + sqlite-vec`，原则上只允许重点改以下文件：

- `knowhub/features/vector-store/types.ts`
- `knowhub/features/vector-store/sqlite-vec-store.ts`
- `knowhub/features/vector-store/index.ts`

如无特殊原因，不应大范围改动以下文件：

- `knowhub/features/knowledge/build-service.ts`
- `knowhub/features/knowledge/service.ts`
- `knowhub/features/retrieval/service.ts`
- `app/api/knowhub/knowledge/[id]/run/route.ts`
- `app/api/knowhub/retrieval/search/route.ts`

---

## 当前阻塞项

- [x] `sqlite-vec` 已确认可在当前运行环境加载
- [x] 知识库运行状态字段和错误展示方式已落库
- [x] embedding 已切到真实 `/embeddings` 调用
- [ ] 文件哈希与增量建库索引尚未实现
- [ ] `Workbench` 搜索模式尚未接入 `KnowHub` 检索 API

---

## 变更日志

### 2026-04-09

- [x] 创建 `knowhub-cycle-list.md`
- [x] 固定当前闭环目标、阶段划分和文件落位方案
- [x] 固定向量库第一版方案为 `SQLite + sqlite-vec`
- [x] 固定后续替换必须通过 `VectorStoreAdapter`
- [x] 完成阶段 1：补齐 `docspace` 的统一 Markdown 原文读取能力
- [x] 实际修改文件：
  - `knowhub/features/docspace/file-reader.ts`
  - `knowhub/features/docspace/types.ts`
  - `knowhub/features/docspace/oss-connector.ts`
  - `knowhub/features/docspace/smb-connector.ts`
  - `knowhub/features/docspace/service.ts`
- [x] 已完成局部 eslint 校验
- [x] `npx tsc --noEmit` 仍被仓库现有 `.next` 与 `reference/obsidian_search` 类型问题阻塞，非本轮新增问题
- [x] 完成阶段 2：补齐策略模板、默认预设、切片执行器与服务层
- [x] 实际修改文件：
  - `knowhub/features/strategies/types.ts`
  - `knowhub/features/strategies/data.ts`
  - `knowhub/features/strategies/registry.ts`
  - `knowhub/features/strategies/preset-storage.ts`
  - `knowhub/features/strategies/preset-repository.ts`
  - `knowhub/features/strategies/executors/markdown-obsidian-slicer.ts`
  - `knowhub/features/strategies/service.ts`
- [x] 已完成阶段 2 局部 eslint 校验
- [x] 完成阶段 3：补齐策略详情抽屉、参数编辑、预设保存与文件测试
- [x] 实际修改文件：
  - `app/api/knowhub/strategies/presets/route.ts`
  - `app/api/knowhub/strategies/presets/[id]/route.ts`
  - `app/api/knowhub/strategies/test/route.ts`
  - `knowhub/components/strategies/strategy-settings-form.tsx`
  - `knowhub/components/strategies/strategy-test-panel.tsx`
  - `knowhub/components/strategies/strategy-detail-drawer.tsx`
  - `knowhub/components/strategies/strategy-card.tsx`
  - `knowhub/components/strategies/strategies-page.tsx`
- [x] 已完成阶段 3 局部 eslint 校验
- [x] 补充 `Markdown 文档` 默认策略入口
- [x] 实际修改文件：
  - `knowhub/features/strategies/registry.ts`
  - `knowhub/features/knowledge/builder-types.ts`
  - `knowhub/features/knowledge/builder-data.ts`
  - `knowhub/components/settings/global-strategy-page.tsx`
  - `knowhub/components/knowledge/folder-strategy-dialog.tsx`
  - `knowhub/components/knowledge/knowledge-builder-dialog.tsx`
- [x] `Markdown 标题段落切片` 已保留在 `正文类`
- [x] 全局策略、知识库配置、文件夹策略已增加 `Markdown 文档` 默认模板
- [x] 已完成本轮局部 eslint 校验
- [x] 完成阶段 4：知识库已切到真实 JSON 存储和服务层
- [x] 实际修改文件：
  - `knowhub/features/knowledge/types.ts`
  - `knowhub/features/knowledge/storage.ts`
  - `knowhub/features/knowledge/repository.ts`
  - `knowhub/features/knowledge/service.ts`
  - `knowhub/features/knowledge/api.ts`
  - `app/api/knowhub/knowledge/route.ts`
  - `app/api/knowhub/knowledge/[id]/route.ts`
  - `knowhub/components/knowledge/knowledge-page.tsx`
  - `knowhub/components/knowledge/knowledge-builder-dialog.tsx`
  - `knowhub/components/knowledge/knowledge-detail-page.tsx`
  - `app/knowhub/knowledge/page.tsx`
  - `app/knowhub/knowledge/[id]/page.tsx`
  - `knowhub/components/knowledge/knowledge-run-button.tsx`
  - `knowhub/components/knowledge/knowledge-card.tsx`
- [x] 已删除遗留静态数据文件 `knowhub/features/knowledge/data.ts`
- [x] 完成阶段 5：接入 `SQLite + sqlite-vec` 建库链路
- [x] 实际修改文件：
  - `knowhub/features/knowledge/builder-data.ts`
  - `knowhub/features/knowledge/embedding-client.ts`
  - `knowhub/features/knowledge/build-service.ts`
  - `knowhub/features/vector-store/types.ts`
  - `knowhub/features/vector-store/sqlite-vec-store.ts`
  - `knowhub/features/vector-store/index.ts`
  - `app/api/knowhub/knowledge/[id]/run/route.ts`
- [x] 已安装依赖：
  - `better-sqlite3`
  - `sqlite-vec`
- [x] 当前默认 embedding 已切到真实 `/embeddings` 调用
- [x] `sqlite-vec` 已做本机加载烟雾测试
- [x] `sqlite-vec` 的 `INTEGER metadata` 写入已统一收敛到适配层，显式使用 `BigInt`
- [x] 已完成阶段 4 / 5 局部 eslint 校验
- [x] 收敛策略详情交互：
  - 预设管理折叠为高级功能
  - 上传改为轻量小按钮
  - 测试区增加重置按钮，按钮宽度按 2/3 和 1/3 排列
- [x] 实际修改文件：
  - `knowhub/components/strategies/strategy-detail-drawer.tsx`
  - `knowhub/components/strategies/strategy-test-panel.tsx`
- [x] 已完成本轮局部 eslint 校验
