import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export interface CustomNodeProps extends Omit<NodeProps, "type" | "data"> {
  type: string;
  data: {
    label: string;
    description?: string;
  };
}

export function CustomWorkflowNode({ data, selected, type }: CustomNodeProps) {
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

  const label = data?.label || "";
  const description = data?.description;

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
            {label}
          </h4>
          {description && (
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              {description}
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
