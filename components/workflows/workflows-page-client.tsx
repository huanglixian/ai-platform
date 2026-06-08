"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getLocalWorkflows, saveLocalWorkflows } from "@/features/workflows/mock-data";
import { Workflow } from "@/features/workflows/types";

// 精致的加号 SVG 图标
function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

// 精致的垃圾桶 SVG 图标
function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

// 优雅的业务流空状态大 SVG 图标
function WorkflowIcon({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25h-1.5A3.375 3.375 0 005.25 5.625v1.5a1.125 1.125 0 01-1.125 1.125h-1.5a3.375 3.375 0 00-3.375 3.375v2.625c0 1.18.91 2.164 2.09 2.201a51.964 51.964 0 003.32 0c1.18-.037 2.09-1.022 2.09-2.201v-.916"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 13.5H4.5m4.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm0 0V10.5m0 3a2.25 2.25 0 002.25-2.25v-1.5m0 3.75a2.25 2.25 0 01-2.25-2.25M19.5 13.5h-4.5m4.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm0 0V10.5m0 3a2.25 2.25 0 002.25-2.25v-1.5m0 3.75a2.25 2.25 0 01-2.25-2.25"
      />
    </svg>
  );
}

// 卡片左上角微型图标
function WorkflowMiniIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3M3 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M3 12l-3 3m3-3l3 3"
      />
    </svg>
  );
}

export function WorkflowsPageClient() {
  const [list, setList] = useState<Workflow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDesc, setNewFlowDesc] = useState("");

  useEffect(() => {
    const data = getLocalWorkflows();
    Promise.resolve().then(() => {
      setList(data);
    });
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
      {/* 头部区域 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">业务流</h1>
          <p className="mt-1.5 text-xs text-slate-400">
            拖拽工具、API 或技能组件，编排逻辑分明的生产工作流。
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-tr from-[#0368b3] to-[#2e7dd2] text-white font-medium text-xs px-4 py-2.5 shadow-md hover:brightness-105 transition-all duration-200"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          新建业务流
        </button>
      </div>

      {/* 列表区域 / 空白状态 */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 backdrop-blur-sm animate-in fade-in-50 duration-300">
          <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-4">
            <WorkflowIcon className="w-10 h-10 stroke-[1.2]" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">暂无业务流</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
            这里还没有业务编排。点击下方按钮，开始创建您的第一个自动化业务工作流。
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-tr from-[#0368b3] to-[#2e7dd2] text-white font-medium text-xs px-4 py-2.5 shadow-md hover:brightness-105 transition-all duration-200"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            创建第一个业务流
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((flow) => (
            <Link
              key={flow.id}
              href={`/workflows/${flow.id}`}
              className="group relative flex flex-col justify-between p-5 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 min-h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1.5 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <WorkflowMiniIcon className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {flow.name}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => handleDelete(flow.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    title="删除"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {flow.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  节点数量: {flow.nodes.length} 个
                </span>
                <span>
                  更新于: {new Date(flow.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 新建弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-xl shadow-2xl p-6 relative animate-in fade-in-50 zoom-in-95 duration-200">
            {/* 顶部的装饰条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl"></div>
            
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-50 text-blue-500">
                <PlusIcon className="w-4 h-4" />
              </span>
              新建业务流
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">名称</label>
                <input
                  type="text"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  placeholder="例如：故障检测处理流"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">描述</label>
                <textarea
                  value={newFlowDesc}
                  onChange={(e) => setNewFlowDesc(e.target.value)}
                  className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                  placeholder="业务流具体用途或流程说明"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="rounded-lg bg-gradient-to-tr from-[#0368b3] to-[#2e7dd2] text-white px-4 py-2 text-xs font-semibold hover:brightness-105 transition-all"
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
