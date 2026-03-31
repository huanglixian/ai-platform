import type { ReactNode } from "react";

import { KnowHubTopNav } from "@/knowhub/components/shared/knowhub-top-nav";

export default function KnowHubLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen w-full bg-background px-6 py-4 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3">
        <KnowHubTopNav />
        {children}
      </div>
    </main>
  );
}
