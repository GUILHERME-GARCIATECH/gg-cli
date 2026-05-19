import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { getProjectRoot, resolveProjectPath } from "../src/utils/config.js";

function runCli(args, options = {}) {
  const indexPath = resolveProjectPath("src/index.js");

  return spawnSync(process.execPath, [indexPath, ...args], {
    encoding: "utf-8",
    env: {
      ...process.env,
      GG_USE_LOCAL_CONFIG: "0"
    },
    ...options
  });
}

test("repo list encontra config mesmo rodando fora da pasta do projeto", () => {
  const projectRoot = getProjectRoot();
  const result = runCli(["repo", "list"], {
    cwd: path.dirname(projectRoot)
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /git/);
  assert.match(result.stdout, /hello-world/);
});

test("help principal lista comandos expandidos", () => {
  const result = runCli(["--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /setup/);
  assert.match(result.stdout, /clean/);
  assert.match(result.stdout, /doctor/);
});

test("alias compacto -rl lista repositorios", () => {
  const result = runCli(["-rl"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /hello-world/);
});

test("alias ro mostra help de repo open", () => {
  const result = runCli(["ro", "--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: gg repo open/);
});

test("alias -ro mostra help de repo open", () => {
  const result = runCli(["-ro", "--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: gg repo open/);
});

test("alias r mostra help de repo", () => {
  const result = runCli(["r", "--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: gg repo\|r/);
});
