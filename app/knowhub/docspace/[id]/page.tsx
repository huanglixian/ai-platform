import { notFound } from "next/navigation";

import { KnowHubDocSpaceDetailPage } from "@/knowhub/components/docspace/docspace-detail-page";
import { getDocSpaceById } from "@/knowhub/features/docspace/service";

export const dynamic = "force-dynamic";

type KnowHubDocSpaceDetailRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function KnowHubDocSpaceDetailRoutePage({
  params,
}: KnowHubDocSpaceDetailRoutePageProps) {
  const { id } = await params;
  const item = await getDocSpaceById(id);

  if (!item) {
    notFound();
  }

  return <KnowHubDocSpaceDetailPage item={item} />;
}
