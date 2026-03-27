import { CreateWorkflowCard } from "@/components/workflows/create-workflow-card";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { CardPageFrame } from "@/components/shared/card-page-frame";
import { workflowRecords } from "@/features/workflows/data";

export default function WorkflowsPage() {
  return (
    <CardPageFrame
      title="工作流列表"
      count={workflowRecords.length}
      itemWidth={332}
      tabs={["全部"]}
      activeTab="全部"
    >
      <CreateWorkflowCard
        title="创建工作流"
        description="建立新的流程编排，串联技能、工具和服务节点。"
      />
      {workflowRecords.map((workflow) => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </CardPageFrame>
  );
}
