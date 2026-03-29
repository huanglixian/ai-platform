import { BotWorkbench } from "@/components/bots/bot-workbench";

type BotWorkbenchPageProps = {
  params: Promise<{
    agentId: string;
  }>;
};

export default async function BotWorkbenchPage({
  params,
}: BotWorkbenchPageProps) {
  const { agentId } = await params;

  return <BotWorkbench agentId={decodeURIComponent(agentId)} />;
}
