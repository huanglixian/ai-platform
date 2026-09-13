import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("内置技能只在首次使用时复制到运行目录", async () => {
  const originalDirectory = process.cwd();
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ai-platform-skills-"));
  try {
    await fs.symlink(path.join(originalDirectory, "features"), path.join(temporaryDirectory, "features"));
    await fs.symlink(path.join(originalDirectory, "lib"), path.join(temporaryDirectory, "lib"));
    await fs.mkdir(path.join(temporaryDirectory, "data", "builtin"), { recursive: true });
    await fs.cp(path.join(originalDirectory, "data", "builtin", "skills"), path.join(temporaryDirectory, "data", "builtin", "skills"), { recursive: true });

    process.chdir(temporaryDirectory);
    const { listSkills } = await import(pathToFileURL(path.join(temporaryDirectory, "features", "skills", "registry.ts")).href);
    const initialSkills = listSkills();
    assert.ok(initialSkills.length > 0);

    await fs.rm(path.join(temporaryDirectory, "data", "storage", "agenthub", "skills", initialSkills[0].id), { recursive: true });
    assert.equal(listSkills().length, initialSkills.length - 1);
  } finally {
    process.chdir(originalDirectory);
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
