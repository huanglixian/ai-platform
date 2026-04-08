import { listDocspaceItems } from "@/knowhub/features/docspace/service";
import { KnowHubOverviewPage } from "@/knowhub/components/overview/overview-page";

export default async function KnowHubPage() {
  const docspaceItems = await listDocspaceItems();

  return <KnowHubOverviewPage docspaceItems={docspaceItems} />;
}
