import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { getProjectRoot, resolveProjectPath } from "../src/utils/config.js";

test("repo list encontra config mesmo rodando fora da pasta do projeto", () => {
  const projectRoot = getProjectRoot();
  const indexPath = resolveProjectPath("src/index.js");
  const result = spawnSync(process.execPath, [indexPath, "repo", "list"], {
    cwd: path.dirname(projectRoot),
    encoding: "utf-8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /dev-study-roadmap/);
  assert.match(result.stdout, /obi-study-roadmap/);
});

test("help principal lista comandos expandidos", () => {
  const indexPath = resolveProjectPath("src/index.js");
  const result = spawnSync(process.execPath, [indexPath, "--help"], {
    encoding: "utf-8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /setup/);
  assert.match(result.stdout, /clean/);
  assert.match(result.stdout, /doctor/);
});

test("alias compacto -rl lista repositorios", () => {
  const indexPath = resolveProjectPath("src/index.js");
  const result = spawnSync(process.execPath, [indexPath, "-rl"], {
    encoding: "utf-8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /dev-study-roadmap/);
});

test("alias ro mostra help de repo open", () => {
  const indexPath = resolveProjectPath("src/index.js");
  const result = spawnSync(process.execPath, [indexPath, "ro", "--help"], {
    encoding: "utf-8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: gg repo open/);
});

test("alias -ro mostra help de repo open", () => {
  const indexPath = resolveProjectPath("src/index.js");
  const result = spawnSync(process.execPath, [indexPath, "-ro", "--help"], {
    encoding: "utf-8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: gg repo open/);
});

test("alias r mostra help de repo", () => {
  const indexPath = resolveProjectPath("src/index.js");
  const result = spawnSync(process.execPath, [indexPath, "r", "--help"], {
    encoding: "utf-8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: gg repo\|r/);
});
