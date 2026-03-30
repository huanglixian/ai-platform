import type { ReactNode } from "react";

type KnowHubPageShellProps = {
  children: ReactNode;
};

export function KnowHubPageShell({ children }: KnowHubPageShellProps) {
  return <div className="flex w-full flex-col gap-5">{children}</div>;
}
