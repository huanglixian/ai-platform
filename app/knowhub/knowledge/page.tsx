import { listDocspaceItems } from "@/knowhub/features/docspace/service";
import { KnowHubKnowledgePage as KnowHubKnowledgeView } from "@/knowhub/components/knowledge/knowledge-page";
import { listKnowledgeItems } from "@/knowhub/features/knowledge/service";

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
  const items = await listKnowledgeItems();
  const { action, docspaceId } = await searchParams;

  return (
    <KnowHubKnowledgeView
      docspaceItems={docspaceItems}
      initialItems={items}
      initialBuilderOpen={action === "create" || Boolean(docspaceId)}
      initialDocspaceId={docspaceId}
    />
  );
}
