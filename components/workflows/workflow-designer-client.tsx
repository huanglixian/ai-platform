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
  NodeTypes,
  Node,
  NodeProps
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { getLocalWorkflows, saveLocalWorkflows } from "@/features/workflows/mock-data";
import { Workflow, WorkflowNode } from "@/features/workflows/types";
import { CustomWorkflowNode, CustomNodeProps } from "./nodes/custom-node";
import { NodePropertiesPanel } from "./panel/node-properties-panel";

interface Props {
  workflowId: string;
}

export function WorkflowDesignerClient({ workflowId }: Props) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 选中的节点通过计算属性获取，保证位置更新后获取最新节点数据
  const selectedNode = useMemo(() => {
    const found = nodes.find((n) => n.id === selectedNodeId);
    return found ? (found as unknown as WorkflowNode) : null;
  }, [nodes, selectedNodeId]);

  // 加载数据
  useEffect(() => {
    const all = getLocalWorkflows();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkflows(all);
    const matched = all.find((w) => w.id === workflowId);
    if (matched) {
      setCurrentWorkflow(matched);
      setNodes(matched.nodes as Node[]);
      setEdges(matched.edges as Edge[]);
    }
  }, [workflowId, setNodes, setEdges]);

  // 自定义节点类型定义
  const nodeTypes = useMemo<NodeTypes>(() => ({
    start: (props: NodeProps) => <CustomWorkflowNode {...(props as unknown as CustomNodeProps)} type="start" />,
    end: (props: NodeProps) => <CustomWorkflowNode {...(props as unknown as CustomNodeProps)} type="end" />,
    model: (props: NodeProps) => <CustomWorkflowNode {...(props as unknown as CustomNodeProps)} type="model" />,
    tool: (props: NodeProps) => <CustomWorkflowNode {...(props as unknown as CustomNodeProps)} type="tool" />,
    service: (props: NodeProps) => <CustomWorkflowNode {...(props as unknown as CustomNodeProps)} type="service" />,
    skill: (props: NodeProps) => <CustomWorkflowNode {...(props as unknown as CustomNodeProps)} type="skill" />
  }), []);

  // 建立连接
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // 选择节点
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // 更新配置
  function handleNodeUpdate(updated: WorkflowNode) {
    setNodes((nds) => nds.map((n) => (n.id === updated.id ? { ...n, data: updated.data } : n)));
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
        type: n.type as WorkflowNode['type'],
        position: n.position,
        data: n.data as unknown as WorkflowNode['data']
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
              className="rounded-lg border border-indigo-200 bg-indigo-50/20 text-indigo-700 font-semibold text-[10px] px-2.5 py-1.5 hover:bg-indigo-50/50 transition-colors cursor-pointer"
            >
              + 模型节点
            </button>
            <button
              onClick={() => addNode("tool")}
              className="rounded-lg border border-amber-200 bg-amber-50/20 text-amber-700 font-semibold text-[10px] px-2.5 py-1.5 hover:bg-amber-50/50 transition-colors cursor-pointer"
            >
              + 工具节点
            </button>
            <button
              onClick={() => addNode("service")}
              className="rounded-lg border border-sky-200 bg-sky-50/20 text-sky-700 font-semibold text-[10px] px-2.5 py-1.5 hover:bg-sky-50/50 transition-colors cursor-pointer"
            >
              + API节点
            </button>
            <button
              onClick={() => addNode("skill")}
              className="rounded-lg border border-violet-200 bg-violet-50/20 text-violet-700 font-semibold text-[10px] px-2.5 py-1.5 hover:bg-violet-50/50 transition-colors cursor-pointer"
            >
              + 技能节点
            </button>
            <span className="text-slate-200 mx-1">|</span>
            <button
              onClick={handleSave}
              className="rounded-lg bg-gradient-to-tr from-[#0368b3] to-[#2e7dd2] text-white font-medium text-[10px] px-4 py-1.5 hover:brightness-105 shadow-sm transition-all cursor-pointer"
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
        onClose={() => setSelectedNodeId(null)}
        onUpdate={handleNodeUpdate}
      />
    </div>
  );
}
