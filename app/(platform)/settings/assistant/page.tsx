import { AssistantSettingsPage } from "@/features/assistant/ui/assistant-settings-page";
import { getAssistantSettings } from "@/features/assistant/settings";

export const dynamic = "force-dynamic";

export default function AssistantSettingsRoute() {
  return <AssistantSettingsPage initialSettings={getAssistantSettings()} />;
}
