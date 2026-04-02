import { listDocSpaces } from "@/knowhub/features/docspaces/service";
import { KnowHubOverviewPage } from "@/knowhub/components/overview/overview-page";

export default async function KnowHubPage() {
  const docspaces = await listDocSpaces();

  return <KnowHubOverviewPage docspaces={docspaces} />;
}
