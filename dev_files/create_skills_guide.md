# 技能创建指南

## 目录结构

每个技能是一个独立目录，目录名就是技能 id。示例：

```txt
storage/agenthub/skills/text-summary/
├─ SKILL.md
├─ skill.json
└─ references/
```

- 目录名必须和 `skill.json.id` 完全一致。
- `SKILL.md` 是技能执行说明，给模型读取。
- `skill.json` 只放管理元数据和触发语句。
- `references/` 放可选参考材料、模板、示例。

## skill.json

只保留必要字段。对于普通单轮技能，样例配置如下：

```json
{
  "id": "text-summary",
  "name": "文本摘要",
  "description": "将长文本压缩为摘要并提取关键要点。",
  "enabled": true,
  "category": "文本处理",
  "owner": "平台示例",
  "triggers": ["帮我总结", "提取要点", "整理成摘要", "概括这段内容"]
}
```

对于**需要多步交互（参数收集）**或**需要调用具体后台工具**的技能，必须配置会话锁定参数，样例如下：

```json
{
  "id": "tower-match",
  "name": "杆塔匹配",
  "description": "根据输电线路设计条件搜索和匹配可用杆塔方案。",
  "enabled": true,
  "category": "业务技能",
  "owner": "平台示例",
  "triggers": ["杆塔搜索", "杆塔匹配", "帮我匹配杆塔"],
  "allowedTools": ["tower.match.search"],
  "requiresSession": true,
  "completionTools": ["tower.match.search"]
}
```

字段说明：

- `id`：技能唯一标识，英文、数字、短横线。
- `name`：页面展示名称。
- `description`：一句话说明技能做什么。
- `enabled`：是否启用，只有 `true` 会进入工作台路由。
- `category`：技能分类，用于页面筛选。
- `owner`：维护方，页面小标签展示。
- `triggers`：触发语句，用于 Skill Router 判断候选。
- `allowedTools` (可选)：允许该技能调用的工具标识数组。不在此列表中的工具在流推理中不可被模型调用。
- `requiresSession` (可选)：布尔值。设置为 `true` 时，平台在模型进入该技能后将进行会话锁定（跳过重新路由），直到满足完成或失败条件。可避免多轮追问时，用户回复不带触发词而导致对话丢状态、退回普通闲聊。
- `completionTools` (可选)：字符串数组。在此数组中的任何工具执行成功后，平台将自动清除当前技能的会话锁定。

不要在 `skill.json` 里写执行步骤、参数 schema、输出模板或长说明。

## SKILL.md

`SKILL.md` 决定技能如何执行，不强制固定章节。

写法要求：

- 用自然语言写清楚模型应该怎么处理用户输入。
- 如果需要固定输出格式，直接在 `SKILL.md` 中写清楚。
- 明确不能编造、不能越权、不能真实调用外部系统等边界。
- 不要把页面展示字段重复写成大段说明。

## references

`references/` 可放：

- 示例输入输出
- 业务模板
- 字段说明
- 判断规则
- 参考资料

当前阶段 references 只作为技能资料沉淀，后续再按需接入模型上下文。

## 注册方式

新增技能时：

1. 在 `storage/agenthub/skills/` 下新建技能目录，例如 `text-summary`。
2. 写入 `skill.json`。
3. 写入 `SKILL.md`。
4. 可选增加 `references/` 文件。
5. 确认 `enabled: true`。

`/skills` 页面会动态读取目录，无需改代码。

## 注意事项

- 触发语句不要堆关键词，写用户真实会说的话。
- 不确定是否应该触发时，宁愿少写触发语句。
- 一个技能只做一类明确任务，不要做成万能技能。
- 技能输出格式必须写在 `SKILL.md`，不要写在 `skill.json`。
- `storage/agenthub/skills` 是 AgentHub 的运行时技能目录；内置演示技能随仓库维护，用户创建或修改的技能属于本地运行时数据。
