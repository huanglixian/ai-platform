# 业务流编排前端功能及导航结构调整实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个一级菜单“业务流”，包含业务流的列表管理以及基于 React Flow 的可视化拓扑连线编排画布前端；同时移除“智能体”菜单，将“技能中心”移入“能力中心”分组。

**Architecture:** 
- 前端交互与画布逻辑基于 `@xyflow/react` 封装，支持拖拽连线和自定义节点。
- 所有数据通过 `localStorage` 缓存在前端进行增删改查操作，免去后端接口开发。
- 全局菜单调整通过 `lib/nav.ts` 配置收口，无需大范围改动物理文件。

**Tech Stack:** Next.js (App Router), React 19, Tailwind CSS, Lucide-React, `@xyflow/react`

---

## 任务拆解与实施步骤

### Task 1: 调整导航结构

**Files:**
- Modify: `lib/nav.ts`

- [ ] **Step 1: 修改导航配置**
  把“智能体”一级导航移除，“技能中心”移至“能力中心”的第一项。添加一级菜单“业务流”。更新 `getActiveNavGroup` 判断。
  替换 [lib/nav.ts](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/lib/nav.ts) 的完整内容为：
  ```typescript
  export type PlatformNavChild = {
    label: string;
    href?: string;
    disabled?: boolean;
    hint?: string;
  };

  export type PlatformNavGroup = {
    key: string;
    label: string;
    href?: string;
    items?: PlatformNavChild[];
  };

  export const platformNavGroups: PlatformNavGroup[] = [
    {
      key: "home",
      label: "工作台",
      href: "/workbench",
    },
    {
      key: "workflows",
      label: "业务流",
      href: "/workflows",
    },
    {
      key: "data",
      label: "数据中心",
      items: [
        {
          label: "知识库",
          href: "/knowhub",
          hint: "知识接入、处理、检索与发布",
        },
        {
          label: "数据库",
          disabled: true,
          hint: "结构化数据接入、清洗与管理",
        },
      ],
    },
    {
      key: "capabilities",
      label: "能力中心",
      items: [
        { label: "技能中心", href: "/skills", hint: "技能封装与能力分发" },
        { label: "通用工具", href: "/tools", hint: "工具接入与调度能力" },
        { label: "业务API", href: "/services", hint: "外部服务与连接配置" },
      ],
    },
    {
      key: "settings",
      label: "配置管理",
      items: [
        { label: "组织管理", disabled: true, hint: "组织结构与协作边界" },
        { label: "角色管理", disabled: true, hint: "角色权限与职责控制" },
        { label: "用户管理", disabled: true, hint: "用户账号与成员维护" },
      ],
    },
  ];

  export function getActiveNavGroup(pathname: string) {
    if (
      pathname === "/" ||
      pathname === "/workbench" ||
      pathname.startsWith("/workbench/")
    ) {
      return "home";
    }

    if (pathname === "/workflows" || pathname.startsWith("/workflows/")) {
      return "workflows";
    }

    if (pathname === "/knowhub" || pathname.startsWith("/knowhub/")) {
      return "data";
    }

    if (pathname === "/tools" || pathname.startsWith("/tools/")) {
      return "capabilities";
    }

    if (pathname === "/services" || pathname.startsWith("/services/")) {
      return "capabilities";
    }

    if (pathname === "/skills" || pathname.startsWith("/skills/")) {
      return "capabilities";
    }

    return "home";
  }
  ```

- [ ] **Step 2: 验证项目构建无误**
  运行: `npm run lint` 和检查页面。

- [ ] **Step 3: 提交修改**
  运行:
  ```bash
  git add lib/nav.ts
  git commit -m "style: adjust nav hierarchy and add workflow menu entry"
  ```

---

### Task 2: 业务流数据类型及 Mock 数据定义

**Files:**
- Create: `features/workflows/types.ts`
- Create: `features/workflows/mock-data.ts`

- [ ] **Step 1: 创建类型声明文件**
  创建 [features/workflows/types.ts](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/features/workflows/types.ts)，内容如下：
  ```typescript
  export interface WorkflowNode {
    id: string;
    type: 'start' | 'model' | 'tool' | 'service' | 'skill' | 'end';
    position: { x: number; y: number };
    data: {
      label: string;
      description: string;
      config: {
        modelName?: string;
        prompt?: string;
        toolId?: string;
        serviceId?: string;
        skillId?: string;
      };
    };
  }

  export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
  }

  export interface Workflow {
    id: string;
    name: string;
    description: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    createdAt: string;
    updatedAt: string;
  }
  ```

- [ ] **Step 2: 创建 Mock 数据及本地存储接口**
  创建 [features/workflows/mock-data.ts](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/features/workflows/mock-data.ts)，内容如下：
  ```typescript
  import { Workflow } from "./types";

  export const INITIAL_WORKFLOWS: Workflow[] = [
    {
      id: "workflow-safety-check",
      name: "高压杆塔安全分析工作流",
      description: "编排图像匹配 API 与技能分析包，对输入的高压杆塔图像进行全链路破损检测。",
      createdAt: "2026-06-08T10:00:00Z",
      updatedAt: "2026-06-08T12:00:00Z",
      nodes: [
        {
          id: "node-start",
          type: "start",
          position: { x: 50, y: 150 },
          data: {
            label: "开始节点",
            description: "接收待检测杆塔图像路径",
            config: { prompt: "输入高压杆塔现场拍摄照片" }
          }
        },
        {
          id: "node-api",
          type: "service",
          position: { x: 280, y: 150 },
          data: {
            label: "杆塔检测API",
            description: "调用后台 tower-match 工具识别杆塔结构",
            config: { serviceId: "tower-match" }
          }
        },
        {
          id: "node-skill",
          type: "skill",
          position: { x: 520, y: 150 },
          data: {
            label: "缺陷诊断技能",
            description: "提取比对特征，诊断裂纹及螺栓脱落风险",
            config: { skillId: "safety-expert" }
          }
        },
        {
          id: "node-end",
          type: "end",
          position: { x: 760, y: 150 },
          data: {
            label: "结束节点",
            description: "输出结构化隐患排查报告",
            config: {}
          }
        }
      ],
      edges: [
        { id: "e1-2", source: "node-start", target: "node-api" },
        { id: "e2-3", source: "node-api", target: "node-skill" },
        { id: "e3-4", source: "node-skill", target: "node-end" }
      ]
    }
  ];

  export function getLocalWorkflows(): Workflow[] {
    if (typeof window === "undefined") return INITIAL_WORKFLOWS;
    const stored = localStorage.getItem("ai_platform_workflows");
    if (!stored) {
      localStorage.setItem("ai_platform_workflows", JSON.stringify(INITIAL_WORKFLOWS));
      return INITIAL_WORKFLOWS;
    }
    return JSON.parse(stored);
  }

  export function saveLocalWorkflows(list: Workflow[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("ai_platform_workflows", JSON.stringify(list));
  }
  ```

- [ ] **Step 3: 提交修改**
  运行:
  ```bash
  git add features/workflows/
  git commit -m "feat: define workflow interfaces and local storage mock helper"
  ```

---

### Task 3: 业务流列表管理页面

**Files:**
- Create: `components/workflows/workflows-page-client.tsx`
- Create: `app/(platform)/workflows/page.tsx`

- [ ] **Step 1: 编写列表展示客户端页面**
  创建 [components/workflows/workflows-page-client.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/components/workflows/workflows-page-client.tsx)，渲染精致的磨砂卡片样式、新建弹窗，并从 `localStorage` 进行数据交互：
  ```tsx
  "use client";

  import React, { useState, useEffect } from "react";
  import Link from "next/link";
  import { getLocalWorkflows, saveLocalWorkflows } from "@/features/workflows/mock-data";
  import { Workflow } from "@/features/workflows/types";

  export function WorkflowsPageClient() {
    const [list, setList] = useState<Workflow[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newFlowName, setNewFlowName] = useState("");
    const [newFlowDesc, setNewFlowDesc] = useState("");

    useEffect(() => {
      setList(getLocalWorkflows());
    }, []);

    function handleCreate() {
      if (!newFlowName.trim()) return;
      const newFlow: Workflow = {
        id: `workflow-${Date.now()}`,
        name: newFlowName,
        description: newFlowDesc || "暂无描述",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          { id: "start-1", type: "start", position: { x: 100, y: 150 }, data: { label: "开始", description: "接收输入参数", config: {} } },
          { id: "end-1", type: "end", position: { x: 600, y: 150 }, data: { label: "结束", description: "输出编排报告", config: {} } }
        ],
        edges: [
          { id: "edge-start-end", source: "start-1", target: "end-1" }
        ]
      };
      const updated = [newFlow, ...list];
      setList(updated);
      saveLocalWorkflows(updated);
      setShowModal(false);
      setNewFlowName("");
      setNewFlowDesc("");
    }

    function handleDelete(id: string, e: React.MouseEvent) {
      e.preventDefault();
      if (!confirm("确定删除该业务流吗？")) return;
      const updated = list.filter((item) => item.id !== id);
      setList(updated);
      saveLocalWorkflows(updated);
    }

    return (
      <div className="w-full px-6 py-8 sm:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-border pb-5 mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-title">业务流</h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              拖拽工具、API 或技能组件，编排逻辑分明的生产工作流。
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-gradient-to-tr from-[#0368b3] to-[#2e7dd2] text-white font-medium text-xs px-4 py-2.5 shadow-md hover:brightness-105 transition-all"
          >
            新建业务流
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((flow) => (
            <Link
              key={flow.id}
              href={`/workflows/${flow.id}`}
              className="group relative flex flex-col justify-between p-5 rounded-xl border border-border bg-white hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 min-h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-title group-hover:text-primary transition-colors">
                    {flow.name}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(flow.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-destructive hover:bg-destructive/5 transition-all"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-5 line-clamp-3">
                  {flow.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                <span>节点数量: {flow.nodes.length} 个</span>
                <span>
                  更新于: {new Date(flow.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* 新建 Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white border border-border rounded-xl shadow-2xl p-6 relative animate-in fade-in-50 zoom-in-95 duration-200">
              <h3 className="text-sm font-bold text-title mb-4">新建业务流</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-500 font-semibold">名称</label>
                  <input
                    type="text"
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="例如：故障检测处理流"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-500 font-semibold">描述</label>
                  <textarea
                    value={newFlowDesc}
                    onChange={(e) => setNewFlowDesc(e.target.value)}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors resize-none"
                    placeholder="业务流具体用途或流程说明"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-lg bg-primary text-white px-4 py-2 text-xs font-semibold hover:brightness-105 transition-all"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: 创建列表页面路由入口**
  创建 [app/(platform)/workflows/page.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/app/\(platform\)/workflows/page.tsx)：
  ```tsx
  import React from "react";
  import { WorkflowsPageClient } from "@/components/workflows/workflows-page-client";

  export const metadata = {
    title: "业务流管理 - AI-业务编排平台",
    description: "拖拽式业务过程可视化编排面板",
  };

  export default function WorkflowsPage() {
    return <WorkflowsPageClient />;
  }
  ```

- [ ] **Step 3: 提交修改**
  运行:
  ```bash
  git add components/workflows/workflows-page-client.tsx app/\(platform\)/workflows/page.tsx
  git commit -m "feat: add workflow listing page UI and Next.js router entry"
  ```

---

### Task 4: 自定义节点与属性面板实现

**Files:**
- Create: `components/workflows/nodes/custom-node.tsx`
- Create: `components/workflows/panel/node-properties-panel.tsx`

- [ ] **Step 1: 创建 React Flow 自定义节点组件**
  创建 [components/workflows/nodes/custom-node.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/components/workflows/nodes/custom-node.tsx)，渲染不同节点：
  ```tsx
  import React from "react";
  import { Handle, Position } from "@xyflow/react";

  interface NodeProps {
    data: {
      label: string;
      description?: string;
    };
    selected?: boolean;
    type: string;
  }

  export function CustomWorkflowNode({ data, selected, type }: NodeProps) {
    const configStyles: Record<string, { border: string; bg: string; icon: string; titleColor: string }> = {
      start: {
        border: "border-emerald-200",
        bg: "bg-emerald-50/70",
        icon: "🟢",
        titleColor: "text-emerald-800"
      },
      end: {
        border: "border-rose-200",
        bg: "bg-rose-50/70",
        icon: "🔴",
        titleColor: "text-rose-800"
      },
      model: {
        border: "border-indigo-200",
        bg: "bg-indigo-50/70",
        icon: "🤖",
        titleColor: "text-indigo-800"
      },
      tool: {
        border: "border-amber-200",
        bg: "bg-amber-50/70",
        icon: "🛠️",
        titleColor: "text-amber-800"
      },
      service: {
        border: "border-sky-200",
        bg: "bg-sky-50/70",
        icon: "📡",
        titleColor: "text-sky-800"
      },
      skill: {
        border: "border-violet-200",
        bg: "bg-violet-50/70",
        icon: "🔮",
        titleColor: "text-violet-800"
      }
    };

    const style = configStyles[type] || {
      border: "border-slate-200",
      bg: "bg-slate-50/70",
      icon: "📦",
      titleColor: "text-slate-800"
    };

    return (
      <div
        className={[
          "px-4 py-3 rounded-xl border-2 shadow-sm min-w-[200px] max-w-[240px] font-sans transition-all duration-300",
          style.border,
          style.bg,
          selected
            ? "shadow-md ring-2 ring-primary/40 border-primary scale-[1.02]"
            : "hover:border-slate-300"
        ].join(" ")}
      >
        {type !== "start" && (
          <Handle
            type="target"
            position={Position.Left}
            style={{ background: "#94a3b8", width: 8, height: 8 }}
          />
        )}

        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className={["text-xs font-bold truncate", style.titleColor].join(" ")}>
              {data.label}
            </h4>
            {data.description && (
              <p className="text-[10px] text-slate-500 mt-1 truncate">
                {data.description}
              </p>
            )}
          </div>
        </div>

        {type !== "end" && (
          <Handle
            type="source"
            position={Position.Right}
            style={{ background: "#94a3b8", width: 8, height: 8 }}
          />
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: 创建右侧属性面板**
  创建 [components/workflows/panel/node-properties-panel.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/components/workflows/panel/node-properties-panel.tsx)，提供编辑：
  ```tsx
  "use client";

  import React from "react";
  import { WorkflowNode } from "@/features/workflows/types";

  interface Props {
    node: WorkflowNode | null;
    onClose: () => void;
    onUpdate: (updatedNode: WorkflowNode) => void;
  }

  export function NodePropertiesPanel({ node, onClose, onUpdate }: Props) {
    if (!node) return null;

    function handleFieldChange(field: string, val: string) {
      if (!node) return;
      onUpdate({
        ...node,
        data: {
          ...node.data,
          [field]: val
        }
      });
    }

    function handleConfigChange(key: string, val: string) {
      if (!node) return;
      onUpdate({
        ...node,
        data: {
          ...node.data,
          config: {
            ...node.data.config,
            [key]: val
          }
        }
      });
    }

    return (
      <div className="w-[340px] border-l border-border bg-white shadow-xl flex flex-col h-full animate-in slide-in-from-right duration-250 font-sans">
        <div className="flex items-center justify-between border-b border-border px-4 py-4.5 bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold text-title flex items-center gap-1.5">
              <span>⚙️</span> 配置节点
            </h3>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wide">
              类型: {node.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs p-1 rounded-md hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500">节点名称</label>
            <input
              type="text"
              value={node.data.label}
              onChange={(e) => handleFieldChange("label", e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500">描述</label>
            <textarea
              value={node.data.description || ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
            <h4 className="text-[11px] font-bold text-title">特有配置</h4>

            {node.type === "start" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-semibold">Prompt 提示词模板</label>
                <textarea
                  value={node.data.config.prompt || ""}
                  onChange={(e) => handleConfigChange("prompt", e.target.value)}
                  className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors resize-y font-mono"
                  placeholder="可在此定义起始的提示词结构"
                />
              </div>
            )}

            {node.type === "model" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold">模型提供商</label>
                  <select
                    value={node.data.config.modelName || "DeepSeek-V4"}
                    onChange={(e) => handleConfigChange("modelName", e.target.value)}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                  >
                    <option value="DeepSeek-V4">DeepSeek-V4 (推荐)</option>
                    <option value="DeepSeek-R1">DeepSeek-R1</option>
                    <option value="GPT-4o">GPT-4o</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold">系统提示词 (System Prompt)</label>
                  <textarea
                    value={node.data.config.prompt || ""}
                    onChange={(e) => handleConfigChange("prompt", e.target.value)}
                    className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors resize-y font-mono"
                  />
                </div>
              </div>
            )}

            {node.type === "tool" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-semibold">选择关联工具</label>
                <select
                  value={node.data.config.toolId || ""}
                  onChange={(e) => handleConfigChange("toolId", e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- 请选择 --</option>
                  <option value="calculator">计算器</option>
                  <option value="weather">天气查询</option>
                </select>
              </div>
            )}

            {node.type === "service" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-semibold">选择业务 API 服务</label>
                <select
                  value={node.data.config.serviceId || ""}
                  onChange={(e) => handleConfigChange("serviceId", e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- 请选择 --</option>
                  <option value="tower-match">杆塔自动匹配接口</option>
                  <option value="image-ocr">图像 OCR 分析服务</option>
                </select>
              </div>
            )}

            {node.type === "skill" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-semibold">选择导入的技能</label>
                <select
                  value={node.data.config.skillId || ""}
                  onChange={(e) => handleConfigChange("skillId", e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- 请选择 --</option>
                  <option value="safety-expert">安全诊断专家</option>
                  <option value="trans-translator">外文文档翻译</option>
                </select>
              </div>
            )}

            {node.type === "end" && (
              <span className="text-xs text-slate-400 italic">结束节点无须额外配置。</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: 提交修改**
  运行:
  ```bash
  git add components/workflows/nodes/custom-node.tsx components/workflows/panel/node-properties-panel.tsx
  git commit -m "feat: implement CustomWorkflowNode and NodePropertiesPanel config components"
  ```

---

### Task 5: 业务流画布及连线设计器实现

**Files:**
- Create: `components/workflows/workflow-designer-client.tsx`
- Create: `app/(platform)/workflows/[workflowId]/page.tsx`

- [ ] **Step 1: 编写设计器 React 客户端组件**
  创建 [components/workflows/workflow-designer-client.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/components/workflows/workflow-designer-client.tsx)，渲染图编辑画布：
  ```tsx
  "use client";

  import React, { useState, useEffect, useCallback, useMemo } from "react";
  import Link from "next/link";
  import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    NodeTypes
  } from "@xyflow/react";
  import "@xyflow/react/dist/style.css";

  import { getLocalWorkflows, saveLocalWorkflows } from "@/features/workflows/mock-data";
  import { Workflow, WorkflowNode } from "@/features/workflows/types";
  import { CustomWorkflowNode } from "./nodes/custom-node";
  import { NodePropertiesPanel } from "./panel/node-properties-panel";

  interface Props {
    workflowId: string;
  }

  export function WorkflowDesignerClient({ workflowId }: Props) {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
    const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

    // 加载
    useEffect(() => {
      const all = getLocalWorkflows();
      setWorkflows(all);
      const matched = all.find((w) => w.id === workflowId);
      if (matched) {
        setCurrentWorkflow(matched);
        setNodes(matched.nodes);
        setEdges(matched.edges);
      }
    }, [workflowId, setNodes, setEdges]);

    // 自定义节点类型定义
    const nodeTypes = useMemo<NodeTypes>(() => ({
      start: (props) => <CustomWorkflowNode {...props} type="start" />,
      end: (props) => <CustomWorkflowNode {...props} type="end" />,
      model: (props) => <CustomWorkflowNode {...props} type="model" />,
      tool: (props) => <CustomWorkflowNode {...props} type="tool" />,
      service: (props) => <CustomWorkflowNode {...props} type="service" />,
      skill: (props) => <CustomWorkflowNode {...props} type="skill" />
    }), []);

    // 建立连接
    const onConnect = useCallback(
      (params: Connection) => setEdges((eds) => addEdge(params, eds)),
      [setEdges]
    );

    // 选择节点
    const onNodeClick = useCallback((_: any, node: any) => {
      setSelectedNode(node as WorkflowNode);
    }, []);

    // 更新配置
    function handleNodeUpdate(updated: WorkflowNode) {
      setNodes((nds) => nds.map((n) => (n.id === updated.id ? updated : n)));
      if (selectedNode && selectedNode.id === updated.id) {
        setSelectedNode(updated);
      }
    }

    // 新增节点
    function addNode(type: 'model' | 'tool' | 'service' | 'skill') {
      const id = `node-${Date.now()}`;
      const labels: Record<string, string> = {
        model: "大模型节点",
        tool: "通用工具",
        service: "业务 API",
        skill: "导入技能"
      };
      const newNode: WorkflowNode = {
        id,
        type,
        position: { x: Math.random() * 200 + 150, y: Math.random() * 200 + 100 },
        data: {
          label: `${labels[type] || "组件"}`,
          description: "尚未进行配置",
          config: {}
        }
      };
      setNodes((nds) => [...nds, newNode]);
    }

    // 保存
    function handleSave() {
      if (!currentWorkflow) return;
      const updatedFlow: Workflow = {
        ...currentWorkflow,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type as any,
          position: n.position,
          data: n.data
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target
        })),
        updatedAt: new Date().toISOString()
      };
      const updatedList = workflows.map((w) => (w.id === workflowId ? updatedFlow : w));
      setWorkflows(updatedList);
      saveLocalWorkflows(updatedList);
      alert("保存成功！");
    }

    if (!currentWorkflow) {
      return (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground font-sans">
          正在加载业务流画布...
        </div>
      );
    }

    return (
      <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden font-sans">
        {/* 画布核心 */}
        <div className="flex-1 flex flex-col relative h-full bg-slate-50">
          {/* 顶栏操作 */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between border border-border bg-white/94 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <Link
                href="/workflows"
                className="text-xs font-semibold text-slate-500 hover:text-title px-2 py-1 hover:bg-slate-100 rounded-md transition-colors"
              >
                ← 返回
              </Link>
              <span className="text-slate-300">|</span>
              <h2 className="text-xs font-bold text-title">{currentWorkflow.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => addNode("model")}
                className="rounded-lg border border-[#indigo-200] bg-indigo-50/20 text-indigo-700 font-semibold text-[10px] px-2.5 py-1.5 hover:bg-indigo-50/50 transition-colors"
              >
                + 模型节点
              </button>
              <button
                onClick={() => addNode("tool")}
                className="rounded-lg border border-[#amber-200] bg-amber-50/20 text-amber-700 font-semibold text-[10px] px-2.5 py-1.5 hover:bg-amber-50/50 transition-colors"
              >
                + 工具节点
              </button>
              <button
                onClick={() => addNode("service")}
                className="rounded-lg border border-[#sky-200] bg-sky-50/20 text-sky-700 font-semibold text-[10px] px-2.5 py-1.5 hover:bg-sky-50/50 transition-colors"
              >
                + API节点
              </button>
              <button
                onClick={() => addNode("skill")}
                className="rounded-lg border border-[#violet-200] bg-violet-50/20 text-violet-700 font-semibold text-[10px] px-2.5 py-1.5 hover:bg-violet-50/50 transition-colors"
              >
                + 技能节点
              </button>
              <span className="text-slate-200 mx-1">|</span>
              <button
                onClick={handleSave}
                className="rounded-lg bg-gradient-to-tr from-[#0368b3] to-[#2e7dd2] text-white font-medium text-[10px] px-4 py-1.5 hover:brightness-105 shadow-sm transition-all"
              >
                保存业务流
              </button>
            </div>
          </div>

          {/* React Flow 编辑器 */}
          <div className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background color="#cbd5e1" gap={16} size={1} />
              <Controls showInteractive={false} />
              <MiniMap style={{ height: 100, width: 140 }} />
            </ReactFlow>
          </div>
        </div>

        {/* 属性抽屉面板 */}
        <NodePropertiesPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={handleNodeUpdate}
        />
      </div>
    );
  }
  ```

- [ ] **Step 2: 创建设计器页面路由入口**
  创建 [app/(platform)/workflows/[workflowId]/page.tsx](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/app/\(platform\)/workflows/\[workflowId\]/page.tsx)：
  ```tsx
  import React from "react";
  import { WorkflowDesignerClient } from "@/components/workflows/workflow-designer-client";

  type PageProps = {
    params: Promise<{
      workflowId: string;
    }>;
  };

  export const metadata = {
    title: "业务流画布编辑 - AI-业务编排平台",
    description: "拖拽节点，编排并发布业务流",
  };

  export default async function WorkflowDetailPage({ params }: PageProps) {
    const { workflowId } = await params;
    return <WorkflowDesignerClient workflowId={workflowId} />;
  }
  ```

- [ ] **Step 3: 提交修改**
  运行:
  ```bash
  git add components/workflows/workflow-designer-client.tsx app/\(platform\)/workflows/\[workflowId\]/page.tsx
  git commit -m "feat: implement WorkflowDesignerClient with React Flow integration"
  ```

---

### Task 6: 更新开发指南文档

**Files:**
- Modify: `dev_files/dev_guide.md`

- [ ] **Step 1: 修改 dev_guide.md 登记新文件**
  将 `workflows` 相应的文件和职责登记进 `dev_guide.md` 的当前目录树以及文件职责列表中。
  修改 [dev_files/dev_guide.md:40-95](file:///Users/huanglixian-m2/Documents/LienCode/Ai_Platform/dev_files/dev_guide.md#L40-L95) 以插入 `workflows` 的路由文件职责定义。
  并在 `## Platform 主要文件索引` 内写入：
  ```markdown
  - 业务流管理页路由入口：`app/(platform)/workflows/page.tsx`
  - 业务流画布设计页路由入口：`app/(platform)/workflows/[workflowId]/page.tsx`
  - 业务流列表客户端组件：`components/workflows/workflows-page-client.tsx`
  - 业务流画布编辑主组件：`components/workflows/workflow-designer-client.tsx`
  - 业务流自定义节点渲染：`components/workflows/nodes/custom-node.tsx`
  - 业务流节点配置抽屉面板：`components/workflows/panel/node-properties-panel.tsx`
  - 业务流类型定义接口：`features/workflows/types.ts`
  - 业务流内置Mock与存储：`features/workflows/mock-data.ts`
  ```

- [ ] **Step 2: 验证全局编译通过**
  运行: `npm run build`
  确认构建成功，无 TypeScript 声明错误，无页面路由冲突。

- [ ] **Step 3: 提交修改**
  运行:
  ```bash
  git add dev_files/dev_guide.md
  git commit -m "docs: update dev_guide.md directory structure and files registry"
  ```
