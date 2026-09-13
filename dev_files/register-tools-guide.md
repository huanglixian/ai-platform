# 业务 API 工具注册指南

在 `Ai Platform` 中，业务 API（服务）被包装为大模型（Agent）可直接调用的强类型工具（Tools）。本指南阐述如何向平台注册一个新的业务 API 工具。

## 注册步骤

要将一个新的业务 API 对接为平台工具，需要遵循以下 5 个步骤：

### 1. 创建具象 Tool 文件
在 `features/services/tools/` 目录下新建一个专用的 Tool 文件（例如 `your-service-name.ts`）。

### 2. 定义 Tool 的强契约 Zod Schema
使用 `zod` 对 API 的输入参数进行严格的结构与类型定义。
- 每一个字段必须加上 `.describe()` 说明，用以向大模型解释该参数的含义、物理单位及取值范围。
- 若参数有固定的枚举选项，必须使用 `z.enum([...])` 进行强类型限制。
- 如果参数为数值，应根据真实 API 请求体的要求，定义为 string 格式或 number 格式。

### 3. 实现 `execute` 真实网络请求
在 Tool 对象的 `execute` 异步函数中，使用 `fetch` 发送真实的 POST/GET 请求调用业务接口。
- 必须包含异常捕获（try-catch），保证接口报错或网络超时不会中断整个 Agent 运行。
- 请求失败时，统一返回 `{ success: false, error: "错误原因" }` 格式。

### 4. 汇总注册
打开 `features/capabilities/implementation-registry.ts`，将新建的 Tool 文件引入，并在实现映射中注册一个唯一的 `handlerKey`（例如 `"your.service.api"`）。随后在 AgentHub Capability Registry 中为该 handlerKey 配置能力元数据。

> [!NOTE]
> Vercel AI SDK 的工具键名中不能包含点号（`.`）。后端在运行时会自动将键名中的点号替换为下划线（`_`）以兼容 SDK，前端展示时会重新转换回点号。

### 5. 绑定到技能包
在需要使用该 API 编排的技能包目录下（如 `data/storage/agenthub/skills/your-skill/`），更新 `skill.json` 中的 `allowedTools` 数组白名单，将上面注册的键名（如 `"your.service.api"`) 加入其中。

---

## 开发规范与最佳实践

1. **一工一档原则**：禁止将多个 API Tool 的 Zod 定义和 `execute` 实现写在同一个文件里。每个 Tool 必须有独立的文件，以保持代码的清晰和可维护性。
2. **契约即事实**：入参的 Zod Schema 和返回的数据结构，必须严格以未来真实的业务 API 规格为准设计。这能确保在 Mock 阶段向真实阶段过渡时，AI Agent、技能包和前端流式解析组件做到 **零代码修改**。
3. **友好描述**：Zod 字段的 `.describe()` 提示词对大模型的传参决策至关重要。请提供详尽的字段释义、标准格式样例（如：`"回路数，必须是字符串格式的数字，例如 '2'"`）。

---

## 示例参考

您可以直接参考以下两处源码：
- **具体 Tool 实现**：`features/services/tools/tower-match.ts`
- **执行适配器**：`features/capabilities/implementation-registry.ts`

### 1. 业务 Tool 独立文件模版 (`features/services/tools/demo.ts`)

```typescript
import { tool } from "ai";
import { z } from "zod";

export const demoTool = tool({
  description: "在这里写该 API 服务的核心用途，帮助大模型判断在什么场景下调用本工具。",
  inputSchema: z.object({
    paramStr: z.string().describe("参数说明，描述物理含义、格式及示例。如 '500'"),
    paramEnum: z.enum(["1", "2"]).describe("对于非开放文本，尽量用 Zod enum 进行强类型限定。如 '1'=钢管，'2'=角钢"),
  }),
  execute: async (input) => {
    try {
      const response = await fetch("http://127.0.0.1:8420/api/your_service_endpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "shudian_tower_test_2026",
        },
        body: JSON.stringify(input),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "请求失败",
      };
    }
  },
});
```

### 2. 执行适配器引入模版 (`features/capabilities/implementation-registry.ts`)

```typescript
import { towerMatchSearch } from "./tools/tower-match";
import { demoTool } from "./tools/demo"; // 1. 引入新文件

export const toolRegistry: Record<string, any> = {
  "tower.match.search": towerMatchSearch,
  "demo.service.invoke": demoTool,       // 2. 追加注册键名（点号会由后端自动替换为下划线兼容 SDK）
};
```
