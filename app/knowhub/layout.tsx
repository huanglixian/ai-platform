import type { ReactNode } from "react";

import { KnowHubTopNav } from "@/knowhub/components/top-nav";

export default function KnowHubLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen w-full bg-background px-6 py-5 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <KnowHubTopNav />
        {children}
      </div>
    </main>
  );
}
