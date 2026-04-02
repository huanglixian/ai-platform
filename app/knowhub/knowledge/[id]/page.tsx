import { listDocSpaces } from "@/knowhub/features/docspaces/service";
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
  const docspaces = await listDocSpaces();

  return <KnowHubKnowledgeDetailPage id={id} docspaces={docspaces} />;
}
