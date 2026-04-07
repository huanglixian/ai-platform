import { listDocSpaces } from "@/knowhub/features/docspaces/service";
import { KnowHubKnowledgePage as KnowHubKnowledgeView } from "@/knowhub/components/knowledge/knowledge-page";

type KnowHubKnowledgeRoutePageProps = {
  searchParams: Promise<{
    action?: string;
    docspaceId?: string;
  }>;
};

export default async function KnowHubKnowledgeRoutePage({
  searchParams,
}: KnowHubKnowledgeRoutePageProps) {
  const docspaces = await listDocSpaces();
  const { action, docspaceId } = await searchParams;

  return (
    <KnowHubKnowledgeView
      docspaces={docspaces}
      initialBuilderOpen={action === "create" || Boolean(docspaceId)}
      initialDocspaceId={docspaceId}
    />
  );
}
