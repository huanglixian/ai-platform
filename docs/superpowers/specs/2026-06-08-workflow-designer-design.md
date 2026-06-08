# 业务流编排功能及导航结构调整设计文档

本文档定义了智能体平台“业务流”可视化编排系统的前端设计，以及导航栏的结构调整。

---

## 1. 导航结构调整设计

### 1.1 需求概述
- 删除一级菜单 `智能体` (agents)。
- 把 `技能中心` (href: `/skills`) 移入 `能力中心` (capabilities) 里面，作为一个子菜单项。
- 新增一级菜单 `业务流` (workflows)，直接跳转至 `/workflows` 页面。

### 1.2 具体变动

#### 修改 [lib/nav.ts](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/lib/nav.ts)
- 更新 `platformNavGroups` 配置，将原本在 `agents` 中的“技能中心”项移动到 `capabilities` 中：
  ```typescript
  {
    key: "capabilities",
    label: "能力中心",
    items: [
      { label: "技能中心", href: "/skills", hint: "技能封装与能力分发" },
      { label: "通用工具", href: "/tools", hint: "工具接入与调度能力" },
      { label: "业务API", href: "/services", hint: "外部服务与连接配置" },
    ],
  }
  ```
- 新增一级菜单 `业务流`：
  ```typescript
  {
    key: "workflows",
    label: "业务流",
    href: "/workflows",
  }
  ```
- 修改 `getActiveNavGroup` 判断逻辑，增加 `/workflows` 激活判定，并把 `/skills` 的激活状态重定向到 `capabilities` 组。

---

## 2. 业务流前端系统设计

我们采用 **方案 A**：基于 `@xyflow/react` 库搭建拖拽可视化连线画布。

### 2.1 整体架构图 (Mermaid)

```mermaid
graph TD
    User([用户]) -->|点击一级菜单| Nav[导航栏 '/workflows']
    Nav -->|路由加载| ListPage[业务流列表页 'workflows/page.tsx']
    ListPage -->|新建/选择| DesignerPage[设计器页 'workflows/[workflowId]/page.tsx']
    
    subgraph 设计器工作区
        DesignerPage --> Canvas[可视化画布 '@xyflow/react']
        DesignerPage --> SidePanel[右侧节点属性配置面板]
        
        Canvas --> NodeStart[开始节点]
        Canvas --> NodeTool[通用工具节点]
        Canvas --> NodeService[业务API节点]
        Canvas --> NodeSkill[技能节点]
        Canvas --> NodeEnd[结束节点]
        
        NodeStart -->|连线 Edge| NodeTool
        NodeTool -->|连线 Edge| NodeSkill
        NodeSkill -->|连线 Edge| NodeEnd
    end
```

### 2.2 节点类型设计

可视化画布中，我们设计以下 5 种自定义节点类型：
1.  **Start (开始节点)**：定义业务流的输入参数（如 query 文本、输入文件等）。
2.  **Tool (通用工具节点)**：选择并配置已有的通用工具，支持配置该工具所要求的参数映射。
3.  **Service (业务 API 节点)**：选择已注册的 API 服务，配置入参。
4.  **Skill (技能节点)**：调用在 `storage/platform/skills` 注册过的配置型技能。
5.  **End (结束节点)**：收集业务流执行的最终输出结果。

### 2.3 交互设计与高级视觉风格
为给用户带来 premium 体验，视觉设计引入以下元素：
- **磨砂玻璃效果 (Glassmorphism)**：列表页和设计器右侧面板采用半透明的背景，搭配毛玻璃滤镜（`backdrop-blur`），提供深度感。
- **动态呼吸灯节点边框**：选中的节点会呈现柔和的蓝色或紫色呼吸灯阴影效果（`shadow-[0_0_15px_rgba(3,104,179,0.25)]`），表明其正处于编辑状态。
- **流畅过渡动画**：抽屉面板滑入与滑出、节点类型选择时的缩放、拖拽连线附带微小的阻尼物理过渡动效。
- **Mermaid 自动同步**：提供一键预览业务流程 Mermaid 代码的展示框，方便与现有项目的 Mermaid 展示逻辑统一。

---

## 3. 文件清单与职责说明

### 3.1 拟新增文件
1.  **[app/(platform)/workflows/page.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/app/\(platform\)/workflows/page.tsx)**
    *   **职责**：业务流列表页的 Next.js 路由入口。
2.  **[app/(platform)/workflows/[workflowId]/page.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/app/\(platform\)/workflows/\[workflowId\]/page.tsx)**
    *   **职责**：设计器主页面的 Next.js 路由入口，接收并向子组件透传 `workflowId`。
3.  **[components/workflows/workflows-page-client.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/components/workflows/workflows-page-client.tsx)**
    *   **职责**：列表页面的 React 客户端实现。展示用户创建的业务流列表，提供新建工作流弹窗以及删除、重命名工作流的快捷入口。
4.  **[components/workflows/workflow-designer-client.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/components/workflows/workflow-designer-client.tsx)**
    *   **职责**：画布设计器主页面客户端组件。初始化 React Flow 实例，管理节点（Nodes）和连线（Edges）的状态，包含画布拖拽、小地图、控制面板，以及顶部的“保存”、“运行”测试等操作按钮。
5.  **[components/workflows/nodes/custom-node.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/components/workflows/nodes/custom-node.tsx)**
    *   **职责**：包含所有自定义节点（Start, Tool, Service, Skill, End）的视觉渲染组件。
6.  **[components/workflows/panel/node-properties-panel.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/components/workflows/panel/node-properties-panel.tsx)**
    *   **职责**：选中节点时右侧滑出的节点参数配置面板，支持根据节点类型动态显示对应的输入框、下拉绑定和 Prompt 编辑框。
7.  **[features/workflows/types.ts](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/features/workflows/types.ts)**
    *   **职责**：定义业务流 JSON 格式的结构规范（Workflow, NodeConfig, Connection 等）。
8.  **[features/workflows/mock-data.ts](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/features/workflows/mock-data.ts)**
    *   **职责**：提供几组内置的演示工作流数据，以便在纯前端模式下提供逼真的初始展现与运行动效模拟。

### 3.2 拟修改文件
1.  **[lib/nav.ts](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/lib/nav.ts)**
    *   **职责**：修改导航菜单配置，移走 `智能体`，引入 `业务流`，调整技能中心所属。
2.  **[dev_files/dev_guide.md](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/dev_files/dev_guide.md)**
    *   **职责**：更新当前项目的目录树结构与文件职责列表，将 `workflows` 新加的文件同步登记。
