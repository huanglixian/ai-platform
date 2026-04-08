import { listDocspaceItems } from "@/knowhub/features/docspace/service";
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
  const docspaceItems = await listDocspaceItems();
  const { action, docspaceId } = await searchParams;

  return (
    <KnowHubKnowledgeView
      docspaceItems={docspaceItems}
      initialBuilderOpen={action === "create" || Boolean(docspaceId)}
      initialDocspaceId={docspaceId}
    />
  );
}
