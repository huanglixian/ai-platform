import { cn } from "@/lib/cn";

export function DataTablePanel({
  children,
  pagination,
  className,
}: {
  children: React.ReactNode;
  pagination?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className="overflow-x-auto">{children}</div>
      {pagination ? <footer className="border-t border-border px-4 py-2 text-sm text-muted-foreground">{pagination}</footer> : null}
    </section>
  );
}
