import { cn } from "@/lib/cn";

const variants = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/15",
  neutral: "bg-muted text-muted-foreground ring-border",
} as const;

export function StatusBadge({
  children,
  status = "neutral",
}: {
  children: React.ReactNode;
  status?: keyof typeof variants;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", variants[status])}>
      {children}
    </span>
  );
}
