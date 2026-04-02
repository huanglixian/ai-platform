import { notFound } from "next/navigation";

import { KnowHubDocumentDetailPage } from "@/knowhub/components/documents/document-detail-page";
import { getDocSpaceById } from "@/knowhub/features/docspaces/service";

export const dynamic = "force-dynamic";

type KnowHubDocumentDetailRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function KnowHubDocumentDetailRoutePage({
  params,
}: KnowHubDocumentDetailRoutePageProps) {
  const { id } = await params;
  const item = await getDocSpaceById(id);

  if (!item) {
    notFound();
  }

  return <KnowHubDocumentDetailPage item={item} />;
}
