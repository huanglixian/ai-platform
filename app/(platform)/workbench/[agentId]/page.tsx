import { WorkbenchPage } from "@/components/workbench/workbench-page";

export const dynamic = "force-dynamic";

type PlatformWorkbenchAgentPageProps = {
  params: Promise<{
    agentId: string;
  }>;
};

export default async function PlatformWorkbenchAgentPage({
  params,
}: PlatformWorkbenchAgentPageProps) {
  const { agentId } = await params;

  return <WorkbenchPage agentId={decodeURIComponent(agentId)} />;
}
