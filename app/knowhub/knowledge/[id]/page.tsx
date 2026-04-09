import { listDocspaceItems } from "@/knowhub/features/docspace/service";
import { KnowHubKnowledgeDetailPage } from "@/knowhub/components/knowledge/knowledge-detail-page";
import { getKnowledgeById, listKnowledgeRuns } from "@/knowhub/features/knowledge/service";

type KnowHubKnowledgeDetailRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function KnowHubKnowledgeDetailRoutePage({
  params,
}: KnowHubKnowledgeDetailRoutePageProps) {
  const { id } = await params;
  const docspaceItems = await listDocspaceItems();
  const item = await getKnowledgeById(id);
  const runs = await listKnowledgeRuns(id);

  return (
    <KnowHubKnowledgeDetailPage
      item={item}
      runs={runs}
      docspaceItems={docspaceItems}
    />
  );
}
