# KnowHub Retrieval 实施 Checklist

## 目标

在当前仓库内补齐 `KnowHub` 检索闭环，并为 `Platform workbench` 提供松耦合搜索能力：

1. `KnowHub` 配置管理可维护 embedding 配置
2. 建库与检索使用真实 embedding 接口完成向量化
3. `KnowHub` 提供按知识库检索的统一 API
4. `KnowHub` 检索页可直接验证召回结果
5. `Platform workbench` 只调用 `KnowHub` 检索 API，不感知 embedding 供应商细节

---

## 已确认边界

- `Platform` 只调用 `KnowHub` 的检索 API 和知识库列表接口
- `KnowHub` 内部自己读取 embedding 配置并调用 `/embeddings`
- `Platform` 不知道 `baseUrl / apiKey / model`
- embedding 配置逻辑放在 `knowhub/features/settings/embedding/*`
- embedding 运行时调用放在 `knowhub/features/knowledge/embedding-client.ts`
- 不在 `Platform` 新增 embedding 配置中心
- 第一版先完成 `KnowHub` 自身闭环，再接 `Workbench`

---

## 不允许偏离的实现边界

- `app/api/knowhub/*` 负责对外接口入口
- `knowhub/features/settings/embedding/*` 只负责 embedding 配置类型、存储、服务
- `knowhub/features/knowledge/embedding-client.ts` 只负责 embedding 请求调用
- `knowhub/features/retrieval/*` 只负责检索查询和结果整理
- `Platform` 页面组件不直接 import `knowhub/features/*` 内部服务
- `Platform` 只通过 `/api/knowhub/retrieval/search` 和知识库列表接口消费能力

---

## 技术方案固定说明

### Embedding 配置

固定管理 3 个参数：

- `baseUrl`
- `apiKey`
- `model`

请求格式参考：

- `reference/obsidian_search/src/core/embeddings.ts`

### 检索返回结构

第一版返回：

- `knowledgeId`
- `filePath`
- `fileName`
- `headingTitle`
- `parentHeadings`
- `startLine`
- `endLine`
- `content`
- `score`

### 平台接入方式

`Workbench` 只消费：

- 知识库列表
- 检索 API

不持有 embedding 配置，不直接请求外部 `/embeddings`

---

## 阶段总览

| 阶段 | 名称 | 状态 | 说明 |
| --- | --- | --- | --- |
| 1 | Retrieval 清单与边界固定 | 已完成 | 已固定目录、阶段和职责边界 |
| 2 | Embedding 配置持久化 | 已完成 | 已补齐配置存储、服务、API 和配置面板 |
| 3 | 真实 Embedding 调用 | 已完成 | 已切到真实 `/embeddings` 请求，并移除 `builtin-hash-384` |
| 4 | KnowHub 检索 API | 已完成 | 已补齐检索服务、API 和结果结构 |
| 5 | KnowHub 检索页 | 已完成 | 已可直接验证知识库召回效果 |
| 6 | Workbench 接入 | 已完成 | 已接入问答/搜索切换、知识库下拉和结果展示 |
| 7 | 收尾与验证 | 进行中 | 继续补充验证、依赖说明和边界说明 |

---

## 阶段 1：Retrieval 清单与边界固定

### 必做项

- [x] 创建 `dev_files/retrieval-list.md`
- [x] 固定目录与命名方案
- [x] 固定 `Platform` 与 `KnowHub` 的职责边界

### 完成标准

- 后续接手者只看本文件即可继续实现
- 不会再把 embedding 配置错误放进 `Platform`

---

## 阶段 2：Embedding 配置持久化

### 目标

在 `KnowHub` 配置管理里维护真实 embedding 配置，并提供读写 API。

### 完成项

- [x] 定义 embedding 配置类型
- [x] 新增 embedding 配置存储
- [x] 新增 embedding 配置服务
- [x] 提供 embedding 配置 API
- [x] 在配置管理页面接入 embedding 配置面板
- [x] `knowhub/features/settings/embedding/embedding-types.ts`
- [x] `knowhub/features/settings/embedding/embedding-storage.ts`
- [x] `knowhub/features/settings/embedding/embedding-config-service.ts`
- [x] `knowhub/components/settings/embedding-settings-panel.tsx`
- [x] `app/api/knowhub/settings/embedding/route.ts`
- [x] `knowhub/components/settings/global-strategy-page.tsx`
- [x] `storage/knowhub/settings/embedding.json` 将在首次读取或保存时自动生成

---

## 阶段 3：真实 Embedding 调用

### 目标

将建库和检索向量化改成读取 embedding 配置并调用真实 `/embeddings` 接口。

### 完成项

- [x] 新增 embedding 运行时客户端
- [x] 移除 `builtin-hash-384` 作为默认正式实现
- [x] 建库时基于配置执行真实 embedding
- [x] 检索 query 时基于配置执行真实 embedding
- [x] `knowhub/features/knowledge/embedding-client.ts`
- [x] 删除旧文件 `knowhub/features/knowledge/embedding-service.ts`
- [x] `knowhub/features/knowledge/build-service.ts`
- [x] `knowhub/features/knowledge/builder-data.ts`
- [x] `knowhub/features/vector-store/index.ts`
- [x] `knowhub/features/vector-store/sqlite-vec-store.ts`
- [x] `knowhub/features/vector-store/types.ts`

---

## 阶段 4：KnowHub 检索 API

### 目标

提供按知识库搜索切片的统一 API，供 `KnowHub` 页面和 `Platform workbench` 共同使用。

### 完成项

- [x] 定义检索结果类型
- [x] 新增 retrieval 服务
- [x] 提供检索 API
- [x] 支持按知识库搜索
- [x] 返回片段、标题链、文档索引和相似度
- [x] `knowhub/features/retrieval/types.ts`
- [x] `knowhub/features/retrieval/service.ts`
- [x] `app/api/knowhub/retrieval/search/route.ts`

---

## 阶段 5：KnowHub 检索页

### 目标

把 `KnowHub` 检索页从占位改成真实可用页面，用来验证召回结果。

### 完成项

- [x] 显示知识库下拉
- [x] 输入 query 并触发检索
- [x] 展示命中片段、标题链、文件路径、行号、分数
- [x] 处理空结果与错误态
- [x] `knowhub/components/retrieval/retrieval-results-panel.tsx`
- [x] `knowhub/components/retrieval/retrieval-page.tsx`

---

## 阶段 6：Workbench 接入

### 目标

在 `Platform workbench` 中接入 `问答 / 搜索` 两种模式，搜索模式通过 `KnowHub` API 执行知识检索。

### 完成项

- [x] 增加 `问答 / 搜索` 切换，默认 `问答`
- [x] 两种模式初始都复用中间输入空态
- [x] 搜索模式显示知识库下拉
- [x] 搜索模式隐藏左侧会话栏
- [x] 搜索模式调用 `KnowHub` 检索 API
- [x] 搜索结果优先渲染片段内容，再显示对应文件信息
- [x] `components/workbench/workbench-search-result-pane.tsx`
- [x] `features/workbench/api.ts`
- [x] `components/workbench/workbench-page.tsx`
- [x] `components/workbench/workbench-empty-state.tsx`
- [x] `components/bots/bot-composer-pane.tsx`

---

## 阶段 7：收尾与验证

### 必做项

- [ ] 更新本文件状态
- [ ] 记录 embedding 配置依赖与失败提示
- [ ] 补充手工验证步骤
- [ ] 记录 `Platform` 与 `KnowHub` 的调用边界

### 计划修改文件

- [ ] `dev_files/retrieval-list.md`

---

## 当前阻塞项

- [ ] 真实 embedding 服务的 `baseUrl / apiKey / model` 尚未配置时，建库与检索无法工作
- [x] 检索页验证能力已落地
- [x] `Workbench` 搜索结果展示已实现

---

## 变更日志

### 2026-04-09

- [x] 创建 `dev_files/retrieval-list.md`
- [x] 固定 `Platform` 与 `KnowHub` 的职责边界
- [x] 固定 embedding 配置目录为 `knowhub/features/settings/embedding/*`
- [x] 固定运行时调用文件为 `knowhub/features/knowledge/embedding-client.ts`
- [x] 完成阶段 2：补齐 embedding 配置持久化、服务、API 和配置面板
- [x] 完成阶段 3：切到真实 `/embeddings` 调用，并移除 `builtin-hash-384` 默认实现
- [x] 完成阶段 4：补齐 retrieval 服务与检索 API
- [x] 完成阶段 5：将 KnowHub 检索页改成真实检索页
- [x] 完成阶段 6：Workbench 接入问答/搜索切换、知识库选择和搜索结果展示
