import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";
import { test } from "node:test";

import { generateNodeCiWorkflow } from "../dist/templates.js";

const expected = {
  npm: ["npm ci", "npm run check --if-present", "npm run test"],
  pnpm: ["pnpm install --frozen-lockfile", "pnpm run --if-present check", "pnpm test"],
  yarn: ["yarn install --immutable", "yarn run --if-present check", "yarn test"],
};

for (const manager of Object.keys(expected)) {
  test(`generated ${manager} install/check/test commands execute in a minimal project`, () => {
    const root = mkdtempSync(join(os.tmpdir(), `actionloom-${manager}-`));
    const bin = join(root, "bin");
    mkdirSync(bin);
    writeFileSync(join(root, "package.json"), JSON.stringify({
      scripts: {
        check: "node -e \"require('node:fs').writeFileSync('checked', 'yes')\"",
        test: "node -e \"require('node:fs').writeFileSync('tested', 'yes')\"",
      },
    }));
    writeFileSync(join(root, "package-lock.json"), JSON.stringify({ name: "fixture", lockfileVersion: 3, packages: {} }));

    if (manager !== "npm") writeManagerShim(bin, manager);

    try {
      const workflow = generateNodeCiWorkflow({ packageManager: manager, nodeVersions: ["20"] });
      const commands = [...workflow.matchAll(/^\s+run: (.+)$/gm)].map((match) => match[1])
        .filter((command) => command === "npm ci" || command.includes("install") || command.includes("check") || command.endsWith("test"));
      assert.deepEqual(commands, expected[manager]);

      for (const command of commands) {
        execFileSync("sh", ["-c", command], {
          cwd: root,
          env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
          stdio: "pipe",
        });
      }
      assert.equal(existsSync(join(root, "checked")), true);
      assert.equal(existsSync(join(root, "tested")), true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

function writeManagerShim(bin, manager) {
  const path = join(bin, manager);
  writeFileSync(path, `#!/bin/sh
set -eu
case "$1" in
  install) exec npm install --ignore-scripts --no-audit --no-fund ;;
  run)
    shift
    if [ "$1" = --if-present ]; then shift; fi
    script="$1"; shift
    exec npm run "$script" ;;
  test) exec npm test ;;
  *) exit 64 ;;
esac
`);
  chmodSync(path, 0o755);
}
