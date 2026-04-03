import { notFound } from "next/navigation";

import { WorkflowDemoPage } from "@/components/workflows/workflow-demo-page";
import { getWorkflowById } from "@/features/workflows/data";

type WorkflowDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkflowDetailPage({
  params,
}: WorkflowDetailPageProps) {
  const { id } = await params;
  const workflow = getWorkflowById(decodeURIComponent(id));

  if (!workflow) {
    notFound();
  }

  return <WorkflowDemoPage workflow={workflow} />;
}
