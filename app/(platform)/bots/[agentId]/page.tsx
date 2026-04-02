import { BotPlayground } from "@/components/bots/bot-playground";

type BotPlaygroundPageProps = {
  params: Promise<{
    agentId: string;
  }>;
};

export default async function BotPlaygroundPage({
  params,
}: BotPlaygroundPageProps) {
  const { agentId } = await params;

  return <BotPlayground agentId={decodeURIComponent(agentId)} />;
}
