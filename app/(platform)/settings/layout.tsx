import type { ReactNode } from "react";
import { requirePageUser } from "@/features/auth/server";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePageUser("users.manage");
  return children;
}
