import { KnowHubDocumentDetailPage } from "@/knowhub/pages/documents/detail-page";

type KnowHubDocumentDetailRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function KnowHubDocumentDetailRoutePage({
  params,
}: KnowHubDocumentDetailRoutePageProps) {
  const { id } = await params;

  return <KnowHubDocumentDetailPage id={id} />;
}
