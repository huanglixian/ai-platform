import type { FormEvent, ReactNode } from "react";

type CreateBotCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  expanded: boolean;
  name: string;
  agentId: string;
  loading: boolean;
  error: string;
  onNameChange: (value: string) => void;
  onAgentIdChange: (value: string) => void;
  onExpand: () => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function CreateBotCard({
  icon,
  title,
  description,
  expanded,
  name,
  agentId,
  loading,
  error,
  onNameChange,
  onAgentIdChange,
  onExpand,
  onCancel,
  onSubmit,
}: CreateBotCardProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  if (expanded) {
    return (
      <form
        onSubmit={handleSubmit}
        className="app-card flex min-h-[176px] w-full flex-col gap-3 border-[#bfd7f2] bg-white p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
              创建自由体
            </div>
            <div className="mt-1 text-[13px] leading-6 text-[#667085]">
              创建后会直接进入对应工作台。
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[8px] border border-[#dbe5f0] px-3 py-1.5 text-[12px] font-medium text-[#51657d] transition-colors hover:border-[#c7d8ea] hover:text-title"
          >
            取消
          </button>
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-[11px] font-medium text-[#7f8ea3]">
              名称
            </span>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="例如：家庭助手"
              className="h-[38px] rounded-[10px] border border-[#dbe5f0] bg-white px-3 text-[13px] text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-medium text-[#7f8ea3]">
              ID（可选）
            </span>
            <input
              value={agentId}
              onChange={(event) => onAgentIdChange(event.target.value)}
              placeholder="例如：family"
              className="h-[38px] rounded-[10px] border border-[#dbe5f0] bg-white px-3 text-[13px] text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
            />
          </label>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="min-h-[20px] text-[12px] text-[#c25555]">{error}</div>
          <button
            type="submit"
            disabled={loading}
            className="h-[34px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
          >
            {loading ? "创建中..." : "确认创建"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={onExpand}
      className="group flex min-h-[176px] w-full flex-col rounded-[10px] border border-dashed border-[#cad6e2] bg-[rgba(255,255,255,0.72)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#7fa8d3] hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#0368b3] text-lg font-semibold text-white shadow-[0_8px_18px_rgba(3,104,179,0.14)]">
        {icon}
      </div>
      <div className="mt-4 flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            {title}
          </h3>
          <p className="line-clamp-2 text-[13px] leading-6 text-[#667085]">
            {description}
          </p>
        </div>
        <div className="w-fit rounded-[999px] border border-[#dbe5f0] bg-white px-3 py-1 text-[11px] font-medium text-[#356da8]">
          从空白开始
        </div>
      </div>
    </button>
  );
}
