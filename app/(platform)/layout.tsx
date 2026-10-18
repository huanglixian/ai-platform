import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/app-shell";
import { requirePageUser } from "@/features/auth/server";

export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePageUser();
  return <AppShell>{children}</AppShell>;
}
