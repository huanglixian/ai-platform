import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/features/auth/server";
import { getProject } from "@/app_factory/server/database";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser("appfactory.use");
  const project = getProject((await params).id);
  if (!project || project.ownerId !== user.id) notFound();
  return children;
}
