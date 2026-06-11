"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { CardPageFrame } from "@/components/shared/card-page-frame";
import { getLocalWorkflows, saveLocalWorkflows } from "@/features/workflows/mock-data";
import { Workflow } from "@/features/workflows/types";

const ITEM_WIDTH = 300;

type WorkflowCardProps = {
  flow: Workflow;
  onDelete: (id: string, event: React.MouseEvent) => void;
};

function WorkflowTrace() {
  return (
    <div className="flex h-5 items-center gap-1.5 text-[#bfd7f2]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#6f96c4]" />
      <span className="h-px w-8 bg-[#d4e0ec]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#9ebde0]" />
      <span className="h-px w-8 bg-[#d4e0ec]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#c7d8ec]" />
    </div>
  );
}

function WorkflowCard({ flow, onDelete }: WorkflowCardProps) {
  return (
    <Link
      href={`/workflows/${flow.id}`}
      className="group relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-xl border border-[#dbe5f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9ebde0] hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
    >
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <WorkflowTrace />
          <button
            type="button"
            onClick={(event) => onDelete(flow.id, event)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
            title="删除业务流"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-5 text-title transition-colors group-hover:text-primary">
          {flow.name}
        </h3>
        <p className="mt-2.5 line-clamp-2 text-xs leading-5 text-[#667085]">
          {flow.description}
        </p>
      </div>

      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2 border-t border-[#dbe8f6] bg-[#f5f9fe] px-4 py-3 text-[10px] text-[#7b8da3]">
        <span className="rounded-full border border-[#dbe8f6] bg-white/80 px-2 py-1 font-semibold text-[#51657d]">
          节点 {flow.nodes.length}
        </span>
        <span className="rounded-full border border-[#dbe8f6] bg-white/80 px-2 py-1 font-semibold text-[#51657d]">
          连线 {flow.edges.length}
        </span>
        <span className="truncate text-right">
          更新于 {new Date(flow.updatedAt).toLocaleDateString("zh-CN")}
        </span>
      </div>
    </Link>
  );
}

function EmptyWorkflows({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="flex min-h-[190px] flex-col items-center justify-center rounded-[10px] border border-dashed border-[#dbe5f0] bg-white px-4 text-center"
      style={{ gridColumn: "1 / -1" }}
    >
      <div className="text-[13px] font-semibold text-title">暂无业务流</div>
      <p className="mt-2 max-w-[320px] text-[12px] leading-5 text-muted-foreground">
        创建一个业务流，把模型、工具、API、技能和知识库编排成可复用的流程资产。
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-1.5 rounded-[8px] bg-[#0368b3] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1a4d87]"
      >
        <Plus size={14} />
        新建业务流
      </button>
    </div>
  );
}

export function WorkflowsPageClient() {
  const [list, setList] = useState<Workflow[]>([]);
  const [keyword, setKeyword] = useState("");
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
    const trimmedName = newFlowName.trim();
    if (!trimmedName) return;

    const newFlow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: trimmedName,
      description: newFlowDesc.trim() || "暂无描述",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 150 },
          data: {
            label: "开始",
            description: "接收输入参数",
            config: {},
          },
        },
      ],
      edges: [],
    };
    const updated = [newFlow, ...list];
    setList(updated);
    saveLocalWorkflows(updated);
    setShowModal(false);
    setNewFlowName("");
    setNewFlowDesc("");
  }

  function handleDelete(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm("确定删除该业务流吗？")) return;
    const updated = list.filter((item) => item.id !== id);
    setList(updated);
    saveLocalWorkflows(updated);
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleWorkflows = list.filter((flow) => {
    if (!normalizedKeyword) {
      return true;
    }

    return (
      flow.name.toLowerCase().includes(normalizedKeyword) ||
      flow.description.toLowerCase().includes(normalizedKeyword)
    );
  });

  return (
    <>
      <CardPageFrame
        title="业务流"
        count={visibleWorkflows.length}
        itemWidth={ITEM_WIDTH}
        actionLabel="新建业务流"
        onActionClick={() => setShowModal(true)}
        searchValue={keyword}
        searchPlaceholder="搜索业务流名称或描述"
        onSearchChange={setKeyword}
      >
        {visibleWorkflows.length ? (
          visibleWorkflows.map((flow) => (
            <WorkflowCard key={flow.id} flow={flow} onDelete={handleDelete} />
          ))
        ) : (
          <EmptyWorkflows onCreate={() => setShowModal(true)} />
        )}
      </CardPageFrame>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[10px] border border-border bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="mb-4 text-sm font-bold text-title">新建业务流</h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">名称</label>
                <input
                  type="text"
                  value={newFlowName}
                  onChange={(event) => setNewFlowName(event.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="例如：故障检测处理流"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">描述</label>
                <textarea
                  value={newFlowDesc}
                  onChange={(event) => setNewFlowDesc(event.target.value)}
                  className="min-h-[80px] w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="业务流具体用途或流程说明"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-105"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
