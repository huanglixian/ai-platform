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

  return <KnowHubKnowledgeDetailPage id={id} />;
}
