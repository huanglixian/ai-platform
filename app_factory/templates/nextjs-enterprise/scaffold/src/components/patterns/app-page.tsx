import { cn } from "@/lib/cn";

export function AppPage({
  children,
  className,
  scroll = "document",
}: {
  children: React.ReactNode;
  className?: string;
  scroll?: "workspace" | "document";
}) {
  return (
    <div className={cn(
      "mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-4 sm:px-6",
      scroll === "workspace" && "min-h-full",
      className,
    )}>
      {children}
    </div>
  );
}
