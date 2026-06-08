import React from "react";
import { AppsPageClient } from "@/components/apps/apps-page-client";

export const metadata = {
  title: "应用中心 - AI-业务编排平台",
  description: "聚合托管外部智能体应用",
};

export default function AppsPage() {
  return <AppsPageClient />;
}
