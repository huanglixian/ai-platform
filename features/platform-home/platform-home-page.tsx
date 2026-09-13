"use client";

import { useState } from "react";

import { AssistantExperience } from "@/features/assistant/ui/assistant-experience";
import { ApplicationCatalog } from "@/features/apps/ui/application-catalog";

export function PlatformHomePage() {
  const [conversationActive, setConversationActive] = useState(false);

  return (
    <section className={conversationActive ? "h-[calc(100vh-104px)] min-h-0 w-full" : "mx-auto w-full max-w-[1440px] space-y-7 pb-8"}>
      <AssistantExperience onConversationChange={setConversationActive} />
      {!conversationActive ? <ApplicationCatalog /> : null}
    </section>
  );
}
