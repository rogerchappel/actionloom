#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const releaseConfig = JSON.parse(await readFile("releasebox.config.json", "utf8"));
const readme = await readFile("README.md", "utf8");

if (releaseConfig.release?.publishNpm === false) {
  const bareRegistryInstall =
    /(?:^|\n)[ \t]*npm install(?: --global| -g)?[ \t]+(?:--save(?:-dev)?[ \t]+)?actionloom[ \t]*(?:\r?\n|$)/;

  if (bareRegistryInstall.test(readme)) {
    console.error(
      "actionloom package smoke failed; README advertises a bare npm registry install while release.publishNpm is false.",
    );
    process.exit(1);
  }

  if (!readme.includes("github.com/rogerchappel/actionloom/releases/download/")) {
    console.error(
      "actionloom package smoke failed; README must link an installable GitHub release asset while npm publication is disabled.",
    );
    process.exit(1);
  }
}

const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

const [packument] = JSON.parse(output);
const packedFiles = new Set(packument.files.map((file) => file.path));
const requiredFiles = new Set(["README.md", "SKILL.md", "LICENSE"]);

if (packageJson.main) {
  requiredFiles.add(packageJson.main.replace(/^\.\//, ""));
}

const binEntries =
  typeof packageJson.bin === "string"
    ? [packageJson.bin]
    : Object.values(packageJson.bin ?? {});

for (const binEntry of binEntries) {
  requiredFiles.add(binEntry.replace(/^\.\//, ""));
}

const missing = [...requiredFiles].filter((file) => !packedFiles.has(file));

if (missing.length > 0) {
  console.error(`${packageJson.name} package smoke failed; missing packed file(s):`);
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log(`${packageJson.name} package smoke passed with ${packument.files.length} packed file(s).`);
