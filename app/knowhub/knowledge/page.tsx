import { listDocSpaces } from "@/knowhub/features/docspaces/service";
import { KnowHubKnowledgePage as KnowHubKnowledgeView } from "@/knowhub/components/knowledge/knowledge-page";

export default async function KnowHubKnowledgeRoutePage() {
  const docspaces = await listDocSpaces();

  return <KnowHubKnowledgeView docspaces={docspaces} />;
}
