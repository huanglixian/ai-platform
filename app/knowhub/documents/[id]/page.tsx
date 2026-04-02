import { KnowHubDocumentDetailPage } from "@/knowhub/components/documents/document-detail-page";

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
