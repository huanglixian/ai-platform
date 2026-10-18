import type { ReactNode } from "react";

import { KnowHubTopNav } from "@/knowhub/components/shared/knowhub-top-nav";
import { requirePageUser } from "@/features/auth/server";

export default async function KnowHubLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePageUser("platform.manage");
  return (
    <main className="min-h-screen w-full bg-background px-6 py-4 sm:px-8">
      <div className="flex w-full flex-col gap-3">
        <KnowHubTopNav />
        {children}
      </div>
    </main>
  );
}
