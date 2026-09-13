import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

import { dataPaths } from "@/lib/data-paths";
import type { SkillMetadata, SkillPackage } from "@/features/skills/skill-types";

const skillsRoot = dataPaths.agentHubSkills;
const bootstrapMarker = path.join(dataPaths.agentHub, ".builtin-skills-initialized");

export function ensureSkillStorage() {
  fs.mkdirSync(dataPaths.agentHub, { recursive: true });
  if (fs.existsSync(bootstrapMarker)) return;
  if (!fs.existsSync(skillsRoot)) fs.cpSync(dataPaths.builtinSkills, skillsRoot, { recursive: true });
  fs.writeFileSync(bootstrapMarker, "");
}

const skillMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  enabled: z.boolean().default(true),
  category: z.string().min(1),
  owner: z.string().default("未指定"),
  triggers: z.array(z.string()).default([]),
  allowedTools: z.array(z.string()).default([]),
  requiresSession: z.boolean().optional(),
  completionTools: z.array(z.string()).optional(),
});

function readJsonFile(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
}

function listReferenceFiles(skillDir: string): { name: string; content: string }[] {
  const referencesDir = path.join(skillDir, "references");

  if (!fs.existsSync(referencesDir)) {
    return [];
  }

  return fs
    .readdirSync(referencesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const relPath = path.join("references", entry.name);
      const absPath = path.join(referencesDir, entry.name);
      const content = fs.readFileSync(absPath, "utf8");
      return { name: relPath, content };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readSkillPackage(skillDir: string): SkillPackage | null {
  const metadataPath = path.join(skillDir, "skill.json");
  const markdownPath = path.join(skillDir, "SKILL.md");
  const mermaidPath = path.join(skillDir, "flow.mermaid");

  if (!fs.existsSync(metadataPath) || !fs.existsSync(markdownPath)) {
    return null;
  }

  const metadata = skillMetadataSchema.parse(readJsonFile(metadataPath)) satisfies SkillMetadata;

  if (metadata.id !== path.basename(skillDir)) {
    throw new Error(`技能目录名与 skill.json id 不一致：${metadata.id}`);
  }

  const flowMermaid = fs.existsSync(mermaidPath)
    ? fs.readFileSync(mermaidPath, "utf8")
    : undefined;

  return {
    ...metadata,
    baseDir: skillDir,
    skillMarkdown: fs.readFileSync(markdownPath, "utf8"),
    referenceFiles: listReferenceFiles(skillDir),
    flowMermaid,
  };
}

export function listSkills() {
  ensureSkillStorage();

  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readSkillPackage(path.join(skillsRoot, entry.name)))
    .filter((skill): skill is SkillPackage => Boolean(skill))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
}

export function listEnabledSkills() {
  return listSkills().filter((skill) => skill.enabled);
}

export function getSkillById(skillId: string) {
  return listSkills().find((skill) => skill.id === skillId) ?? null;
}
