import React from "react";
import { WorkflowsPageClient } from "@/components/workflows/workflows-page-client";

export const metadata = {
  title: "业务流管理 - AI-业务编排平台",
  description: "拖拽式业务过程可视化编排面板",
};

export default function WorkflowsPage() {
  return <WorkflowsPageClient />;
}
