# 平台消息反馈

`app/layout.tsx` 只挂载一个 `NotificationProvider`，覆盖首页、AppFactory 和 KnowHub。外部应用与生成的项目有自己的界面边界。

## 选择展示位置

| 场景 | 用法 |
| --- | --- |
| 用户操作成功或请求失败 | `notify.success / error / warning / info` |
| 字段校验、页面不可用、配置缺失 | 字段提示或 `InlineNotice` |
| 删除前确认 | `ConfirmDialog`，请求失败后保留确认框并使用 Toast |
| 任务执行过程、历史结果、AI 对话 | 保留业务区域；任务状态变化时可附加一次 Toast |

通知由负责操作的组件发出。请求工具只返回结果或抛出错误，避免一次失败在多个层级重复提示。后台轮询失败保留连接状态，不逐次弹 Toast；首次读取的历史任务不补发完成通知。

## 调用

```ts
import { notify } from "@/features/feedback/notify";

notify.success("信息已保存");
notify.error("保存失败，请重试");
notify.warning("部分应用停止失败", { details: "应用名称：失败原因" });

const id = notify.loading("正在处理", { id: "operation:record-id" });
notify.success("处理完成", { id });
```

普通重复消息在显示期间更新已有 Toast；指定 `id` 可让同一操作从加载更新为结果。`notify.dismiss(id)` 主动关闭。支持 `description`、`duration`（毫秒，`0` 表示手动关闭）、`action: { label, onClick }`。

同时显示最多 3 条。成功默认 3 秒，其余普通结果默认 6 秒；加载中和包含详情的消息保留到手动关闭或被同 ID 结果替换。悬停、键盘聚焦时由 Base UI 暂停计时。通知不持久化，详细任务记录仍由各业务模块管理。

样式集中在 `notifications.css`；品牌相关的边框与交互颜色使用现有皮肤变量，成功、失败和警告颜色保持固定语义。新增业务无需重复实现定位、队列、定时器或动画。
