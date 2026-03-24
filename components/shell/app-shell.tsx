import type { ReactNode } from "react";

import { TopNav } from "./top-nav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 px-5 py-6 sm:px-8">
        {children}
      </main>
    </div>
  );
}
