import { listDocspaceItems } from "@/knowhub/features/docspace/service";
import { KnowHubKnowledgeDetailPage } from "@/knowhub/components/knowledge/knowledge-detail-page";

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

  return <KnowHubKnowledgeDetailPage id={id} docspaceItems={docspaceItems} />;
}
