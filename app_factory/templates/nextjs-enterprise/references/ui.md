# 企业 UI 与主题

优先使用 `AppShell`、`AppPage`、`PageHeader`、`FilterBar`、`DataTablePanel`、`FormSection`、`DetailSection`、`EmptyState` 和 `ErrorState`。基础控件在 `components/ui`，应用壳在 `components/layout`，跨业务组合在 `components/patterns`；业务表格列、字段和交互仍留在最近的业务模块。

桌面工作页保持紧凑：标题和主要操作通常一行，搜索与常用筛选通常一行，然后尽快进入列表、详情或编辑器。不要默认叠加 Hero、应用介绍、大说明区或一排 KPI 卡片。分析与监控页只有在指标本身是业务主体时才使用图表。

主题从 `src/config/theme.ts` 选择 `ocean` 或 `teal`，通过 `src/styles/tokens.css` 和 `themes.css` 的语义 token 生效。不要在业务页面散落固定品牌色；成功、警告、危险色保持语义独立。保持控件高度、圆角、间距、焦点和无障碍状态一致，窄屏时允许表格横向滚动或改为单列。
