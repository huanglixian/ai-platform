import { SkillsPageClient } from "@/components/skills/skills-page-client";
import { listSkillRecords } from "@/features/skills/data";

export default function SkillsPage() {
  return <SkillsPageClient skills={listSkillRecords()} />;
}
