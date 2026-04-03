import Link from "next/link";

import type { WorkflowNode, WorkflowRecord } from "@/features/workflows/types";

type WorkflowDemoPageProps = {
  workflow: WorkflowRecord;
};

const nodeThemeMap: Record<
  WorkflowNode["kind"],
  {
    badge: string;
    badgeText: string;
    border: string;
    shadow: string;
  }
> = {
  start: {
    badge: "开始",
    badgeText: "text-[#17603a]",
    border: "border-[#b9e7c7]",
    shadow: "shadow-[0_12px_28px_rgba(34,197,94,0.12)]",
  },
  llm: {
    badge: "LLM",
    badgeText: "text-[#1a4d87]",
    border: "border-[#bfd7f2]",
    shadow: "shadow-[0_12px_28px_rgba(46,125,210,0.12)]",
  },
  tool: {
    badge: "工具",
    badgeText: "text-[#7a4a12]",
    border: "border-[#f3d6af]",
    shadow: "shadow-[0_12px_28px_rgba(245,158,11,0.14)]",
  },
  condition: {
    badge: "条件",
    badgeText: "text-[#7b3aed]",
    border: "border-[#ddd0ff]",
    shadow: "shadow-[0_12px_28px_rgba(139,92,246,0.14)]",
  },
  template: {
    badge: "模板",
    badgeText: "text-[#9a3412]",
    border: "border-[#fed7aa]",
    shadow: "shadow-[0_12px_28px_rgba(249,115,22,0.12)]",
  },
  end: {
    badge: "结束",
    badgeText: "text-[#475467]",
    border: "border-[#d5dbe5]",
    shadow: "shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
  },
};

function WorkflowNodeCard({ node }: { node: WorkflowNode }) {
  const theme = nodeThemeMap[node.kind];

  return (
    <div
      className={[
        "relative min-w-[220px] rounded-[18px] border bg-white px-4 py-4",
        theme.border,
        theme.shadow,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className={[
              "inline-flex rounded-full bg-[#f8fbff] px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em]",
              theme.badgeText,
            ].join(" ")}
          >
            {theme.badge}
          </div>
          <div className="mt-3 text-[16px] font-semibold text-title">
            {node.title}
          </div>
          <div className="mt-1 text-[12px] font-medium text-[#667085]">
            {node.subtitle}
          </div>
        </div>
        <div className="rounded-[10px] bg-[#f6f8fb] px-2.5 py-1 text-[11px] font-medium text-[#51657d]">
          {node.id}
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-6 text-[#51657d]">{node.detail}</p>
      {node.output ? (
        <div className="mt-4 rounded-[12px] border border-dashed border-[#d6e0eb] bg-[#fbfdff] px-3 py-2.5 text-[12px] leading-5 text-[#4b5f77]">
          输出：{node.output}
        </div>
      ) : null}
    </div>
  );
}

export function WorkflowDemoPage({ workflow }: WorkflowDemoPageProps) {
  return (
    <div className="flex w-full flex-col gap-5">
      <section className="overflow-hidden rounded-[22px] border border-[#dce6f1] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5fd_55%,#f8fbff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[760px]">
            <Link
              href="/workflows"
              className="inline-flex rounded-full border border-[#d6e3f0] bg-white/80 px-3 py-1 text-[12px] font-medium text-[#51657d] transition-colors hover:border-[#bfd7f2] hover:text-title"
            >
              返回工作流列表
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white text-[24px] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                {workflow.emoji}
              </div>
              <div>
                <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-title">
                  {workflow.name}
                </h1>
                <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7a8ca4]">
                  {workflow.code}
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-[760px] text-[14px] leading-7 text-[#51657d]">
              {workflow.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {workflow.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#d7e4f1] bg-white/85 px-3 py-1 text-[11px] font-medium text-[#51657d]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            {workflow.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[16px] border border-white/80 bg-white/88 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
              >
                <div className="text-[12px] font-medium text-[#7a8ca4]">
                  {metric.label}
                </div>
                <div className="mt-1 text-[20px] font-semibold text-title">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[22px] border border-[#dce6f1] bg-[radial-gradient(circle_at_top_left,#f8fbff_0%,#f3f7fc_38%,#eef3f8_100%)] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dde6f0] pb-4">
            <div>
              <div className="text-[18px] font-semibold text-title">
                工作流 Demo 画布
              </div>
              <div className="mt-1 text-[13px] text-[#667085]">
                参考 Dify 的节点编排形态，展示开始、处理中间节点与结束输出。
              </div>
            </div>
            <div className="rounded-full border border-[#d7e4f1] bg-white px-3 py-1 text-[11px] font-medium text-[#51657d]">
              串行编排 · {workflow.nodes.length} 个节点
            </div>
          </div>

          <div className="mt-5 overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-4 pr-2">
              {workflow.nodes.map((node, index) => (
                <div key={node.id} className="flex items-center gap-4">
                  <WorkflowNodeCard node={node} />
                  {index < workflow.nodes.length - 1 ? (
                    <div className="flex min-w-[96px] flex-col items-center gap-2">
                      <div className="h-[2px] w-full rounded-full bg-[linear-gradient(90deg,#bfd7f2_0%,#6f96c4_100%)]" />
                      <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#6b7f98] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
                        {workflow.edges[index]?.label ?? "下一步"}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <section className="app-card-no-hover rounded-[22px] p-5">
            <div className="text-[16px] font-semibold text-title">运行摘要</div>
            <div className="mt-4 space-y-4 text-[13px] leading-6 text-[#51657d]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                  场景
                </div>
                <div className="mt-1">{workflow.summary.scenario}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                  输入
                </div>
                <div className="mt-1">{workflow.summary.input}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                  输出
                </div>
                <div className="mt-1">{workflow.summary.output}</div>
              </div>
            </div>
          </section>

          <section className="app-card-no-hover rounded-[22px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[16px] font-semibold text-title">运行轨迹</div>
              <div className="rounded-full bg-[#eef5fd] px-2.5 py-1 text-[11px] font-medium text-[#1a4d87]">
                Demo
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {workflow.runLogs.map((log) => (
                <div
                  key={log.label}
                  className="rounded-[14px] border border-[#e5ebf2] bg-[#fbfdff] px-3.5 py-3"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                    {log.label}
                  </div>
                  <div className="mt-1 text-[13px] leading-6 text-[#51657d]">
                    {log.value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
