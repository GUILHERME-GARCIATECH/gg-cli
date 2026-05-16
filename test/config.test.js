import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getProjectRoot,
  readRepos,
  readSettings,
  resolveProjectPath
} from "../src/utils/config.js";

test("resolve caminhos a partir da raiz real do projeto", () => {
  const root = getProjectRoot();

  assert.equal(path.basename(root), "gg-cli");
  assert.equal(resolveProjectPath("config/repos.json"), path.join(root, "config", "repos.json"));
  assert.equal(fs.existsSync(resolveProjectPath("config/settings.json")), true);
});

test("le repositorios e settings do projeto", () => {
  const repos = readRepos();
  const settings = readSettings();

  assert.equal(Array.isArray(repos), true);
  assert.equal(repos.some((repo) => repo.name === "dev-study-roadmap"), true);
  assert.equal(settings.facultyWorkspace, "C:\\gg-faculdade");
});
