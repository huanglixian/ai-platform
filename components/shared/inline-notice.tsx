import type { ReactNode } from "react";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";

type InlineNoticeProps = {
  children: ReactNode;
  variant?: "error" | "warning" | "info";
  action?: ReactNode;
  className?: string;
};

const appearances = {
  error: { Icon: CircleAlert, style: "border-rose-200 bg-rose-50 text-rose-700" },
  warning: { Icon: TriangleAlert, style: "border-amber-200 bg-amber-50 text-amber-800" },
  info: { Icon: Info, style: "border-slate-200 bg-slate-50 text-slate-600" },
};

export function InlineNotice({ children, variant = "error", action, className = "" }: InlineNoticeProps) {
  const { Icon, style } = appearances[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs leading-5 ${style} ${className}`}>
      <Icon size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 break-words">{children}</div>
      {action ? <div className="shrink-0 font-medium underline underline-offset-2">{action}</div> : null}
    </div>
  );
}
