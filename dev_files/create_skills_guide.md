# 技能创建指南

## 目录结构

每个技能是一个独立目录，目录名就是技能 id。示例：

```txt
storage/platform/skills/text-summary/
├─ SKILL.md
├─ skill.json
└─ references/
```

- 目录名必须和 `skill.json.id` 完全一致。
- `SKILL.md` 是技能执行说明，给模型读取。
- `skill.json` 只放管理元数据和触发语句。
- `references/` 放可选参考材料、模板、示例。

## skill.json

只保留必要字段：

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

字段说明：

- `id`：技能唯一标识，英文、数字、短横线。
- `name`：页面展示名称。
- `description`：一句话说明技能做什么。
- `enabled`：是否启用，只有 `true` 会进入工作台路由。
- `category`：技能分类，用于页面筛选。
- `owner`：维护方，页面小标签展示。
- `triggers`：触发语句，用于 Skill Router 判断候选。

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

1. 在 `storage/platform/skills/` 下新建技能目录，例如 `text-summary`。
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
- 当前 `.gitignore` 忽略 `/storage`，本地技能包默认不会随代码提交。
