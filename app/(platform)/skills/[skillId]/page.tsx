import { notFound } from "next/navigation";
import { getSkillById } from "@/features/skills/registry";
import { SkillDetailPageClient } from "./detail-page-client";

type PageProps = {
  params: Promise<{
    skillId: string;
  }>;
};

export default async function SkillDetailPage(props: PageProps) {
  const { skillId } = await props.params;
  const skill = getSkillById(skillId);

  if (!skill) {
    notFound();
  }

  return <SkillDetailPageClient skill={skill} />;
}
