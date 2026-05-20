import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  findConfigFiles,
  getWildcardConfig,
  importConfig,
  isWildcardConfig,
  pushConfig,
  shouldBackupCurrentConfig
} from "../src/commands/config.js";
import { resolveProjectPath } from "../src/utils/config.js";

function withDataRoot(callback) {
  const previousValue = process.env.GG_DATA_ROOT;
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gg-config-test-"));

  process.env.GG_DATA_ROOT = tempRoot;

  try {
    return callback(tempRoot);
  } finally {
    if (previousValue === undefined) {
      delete process.env.GG_DATA_ROOT;
    } else {
      process.env.GG_DATA_ROOT = previousValue;
    }

    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function createConfigSource(root, repos = [{ name: "private-repo" }], settings = { defaultWorkspace: "C:\\private" }) {
  const sourcePath = path.join(root, "source");

  writeJson(path.join(sourcePath, "repos.local.json"), repos);
  writeJson(path.join(sourcePath, "settings.local.json"), settings);

  return sourcePath;
}

function runCli(args, env = {}) {
  return spawnSync(process.execPath, [resolveProjectPath("src/index.js"), ...args], {
    encoding: "utf-8",
    env: {
      ...process.env,
      ...env
    }
  });
}

function hasGit() {
  return spawnSync("git", ["--version"], { encoding: "utf-8" }).status === 0;
}

function runGit(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf-8"
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}

test("detecta config coringa semanticamente", () => {
  const { repos, settings } = getWildcardConfig();

  assert.equal(isWildcardConfig(repos, settings), true);
  assert.equal(isWildcardConfig([{ name: "meu-repo" }], settings), false);
  assert.equal(shouldBackupCurrentConfig({ repos, settings }), false);
  assert.equal(shouldBackupCurrentConfig({ repos: [{ name: "meu-repo" }], settings }), true);
});

test("prefere arquivos local no repo privado", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gg-config-source-"));

  try {
    const sourcePath = createConfigSource(tempRoot);
    writeJson(path.join(sourcePath, "repos.json"), [{ name: "publico" }]);
    writeJson(path.join(sourcePath, "settings.json"), { defaultWorkspace: "C:\\publico" });

    const files = findConfigFiles(sourcePath);

    assert.equal(path.basename(files.reposPath), "repos.local.json");
    assert.equal(path.basename(files.settingsPath), "settings.local.json");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("importa pasta local, lembra origem e nao faz backup de config coringa", () => {
  withDataRoot((dataRoot) => {
    const { repos, settings } = getWildcardConfig();
    const sourcePath = createConfigSource(dataRoot);

    writeJson(path.join(dataRoot, "config", "repos.json"), repos);
    writeJson(path.join(dataRoot, "config", "settings.json"), settings);

    const result = importConfig(sourcePath);
    const savedSource = JSON.parse(fs.readFileSync(path.join(dataRoot, "config", "config-source.json"), "utf-8"));

    assert.equal(result.backup.created, false);
    assert.equal(savedSource.source, sourcePath);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dataRoot, "config", "repos.json"), "utf-8"))[0].name, "private-repo");
    assert.equal(fs.existsSync(path.join(dataRoot, "config", "backups")), false);
  });
});

test("cria backup antes de importar por cima de config pessoal", () => {
  withDataRoot((dataRoot) => {
    const sourcePath = createConfigSource(dataRoot, [{ name: "novo" }], { defaultWorkspace: "C:\\novo" });

    writeJson(path.join(dataRoot, "config", "repos.json"), [{ name: "antigo" }]);
    writeJson(path.join(dataRoot, "config", "settings.json"), { defaultWorkspace: "C:\\antigo" });

    const result = importConfig(sourcePath);
    const backupDir = path.join(dataRoot, "config", "backups");

    assert.equal(result.backup.created, true);
    assert.equal(fs.readdirSync(backupDir).length, 2);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dataRoot, "config", "repos.json"), "utf-8"))[0].name, "novo");
  });
});

test("config list e import funcionam pela CLI com data root temporario", () => {
  withDataRoot((dataRoot) => {
    const sourcePath = createConfigSource(dataRoot);

    writeJson(path.join(dataRoot, "config", "repos.json"), []);
    writeJson(path.join(dataRoot, "config", "settings.json"), {});

    const importResult = runCli(["config", "import", sourcePath], { GG_DATA_ROOT: dataRoot });
    const listResult = runCli(["config", "list"], { GG_DATA_ROOT: dataRoot });

    assert.equal(importResult.status, 0, importResult.stderr);
    assert.match(importResult.stdout, /Configuracao importada com sucesso/);
    assert.equal(listResult.status, 0, listResult.stderr);
    assert.match(listResult.stdout, /Origem lembrada/);
    assert.match(listResult.stdout, /private-repo/);
  });
});

test("push copia configs, commita e envia para repo privado local", { skip: !hasGit() }, () => {
  withDataRoot((dataRoot) => {
    const remotePath = path.join(dataRoot, "remote.git");
    const workPath = path.join(dataRoot, "private-config");

    writeJson(path.join(dataRoot, "config", "repos.json"), [{ name: "repo-atual" }]);
    writeJson(path.join(dataRoot, "config", "settings.json"), { defaultWorkspace: "C:\\atual" });

    runGit(["init", "--bare", remotePath], dataRoot);
    runGit(["clone", remotePath, workPath], dataRoot);
    runGit(["config", "user.name", "GG Test"], workPath);
    runGit(["config", "user.email", "gg-test@example.com"], workPath);
    fs.writeFileSync(path.join(workPath, "README.md"), "# config\n", "utf-8");
    runGit(["add", "README.md"], workPath);
    runGit(["commit", "-m", "init"], workPath);
    runGit(["push", "-u", "origin", "HEAD"], workPath);

    const result = pushConfig(workPath);
    const status = runGit(["status", "--short", "--", "repos.local.json", "settings.local.json"], workPath);

    assert.equal(result.changed, true);
    assert.equal(status.stdout.trim(), "");
    assert.equal(JSON.parse(fs.readFileSync(path.join(workPath, "repos.local.json"), "utf-8"))[0].name, "repo-atual");
  });
});
