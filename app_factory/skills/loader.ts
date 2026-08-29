import fs from "node:fs/promises";
import path from "node:path";

const skillsRoot = path.join(process.cwd(), "app_factory", "skills");

export async function readAppFactorySkill(skillId = "nextjs-build", references: string[] = []) {
  const skillRoot = path.join(skillsRoot, skillId);
  const skillMarkdown = await fs.readFile(path.join(skillRoot, "SKILL.md"), "utf8");
  const referenceFiles = await Promise.all(
    references.map(async (name) => ({ name, content: await fs.readFile(path.join(skillRoot, "references", name), "utf8") })),
  );
  return { skillId, skillMarkdown, referenceFiles };
}
