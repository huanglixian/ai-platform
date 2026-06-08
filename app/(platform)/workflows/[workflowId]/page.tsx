import React from "react";
import { WorkflowDesignerClient } from "@/components/workflows/workflow-designer-client";

type PageProps = {
  params: Promise<{
    workflowId: string;
  }>;
};

export const metadata = {
  title: "业务流画布编辑 - AI-业务编排平台",
  description: "拖拽节点，编排并发布业务流",
};

export default async function WorkflowDetailPage({ params }: PageProps) {
  const { workflowId } = await params;
  return <WorkflowDesignerClient workflowId={workflowId} />;
}
