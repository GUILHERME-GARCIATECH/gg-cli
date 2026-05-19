import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  getDataRoot,
  getProjectRoot,
  readRepos,
  readSettings,
  resolveConfigPath,
  resolveDataPath,
  resolveProjectPath
} from "../src/utils/config.js";

function withDataRoot(value, callback) {
  const previousValue = process.env.GG_DATA_ROOT;
  const previousLocalConfig = process.env.GG_USE_LOCAL_CONFIG;

  if (value === null) {
    delete process.env.GG_DATA_ROOT;
  } else {
    process.env.GG_DATA_ROOT = value;
  }

  delete process.env.GG_USE_LOCAL_CONFIG;

  try {
    callback();
  } finally {
    if (previousValue === undefined) {
      delete process.env.GG_DATA_ROOT;
    } else {
      process.env.GG_DATA_ROOT = previousValue;
    }

    if (previousLocalConfig === undefined) {
      delete process.env.GG_USE_LOCAL_CONFIG;
    } else {
      process.env.GG_USE_LOCAL_CONFIG = previousLocalConfig;
    }
  }
}

function withLocalConfig(value, callback) {
  const previousValue = process.env.GG_USE_LOCAL_CONFIG;
  process.env.GG_USE_LOCAL_CONFIG = value;

  try {
    callback();
  } finally {
    if (previousValue === undefined) {
      delete process.env.GG_USE_LOCAL_CONFIG;
    } else {
      process.env.GG_USE_LOCAL_CONFIG = previousValue;
    }
  }
}

test("resolve caminhos a partir da raiz real do projeto", () => {
  const root = getProjectRoot();

  assert.equal(path.basename(root), "gg-cli");
  assert.equal(resolveProjectPath("config/repos.json"), path.join(root, "config", "repos.json"));
  assert.equal(fs.existsSync(resolveProjectPath("config/settings.json")), true);
});

test("usa a raiz do projeto como data root em desenvolvimento", () => {
  withDataRoot(null, () => {
    const root = getProjectRoot();

    assert.equal(getDataRoot(), root);
    assert.equal(resolveDataPath("config/repos.json"), path.join(root, "config", "repos.json"));
  });
});

test("usa GG_DATA_ROOT como data root quando definido", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gg-data-root-"));

  try {
    fs.mkdirSync(path.join(tempRoot, "config"));
    fs.writeFileSync(
      path.join(tempRoot, "config", "settings.json"),
      JSON.stringify({ defaultWorkspace: "C:\\custom-workspace" }),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(tempRoot, "config", "repos.json"),
      JSON.stringify([{ name: "repo-instalado" }]),
      "utf-8"
    );

    withDataRoot(tempRoot, () => {
      assert.equal(getDataRoot(), tempRoot);
      assert.equal(resolveDataPath("config/settings.json"), path.join(tempRoot, "config", "settings.json"));
      assert.equal(resolveConfigPath("settings.json"), path.join(tempRoot, "config", "settings.json"));
      assert.equal(readSettings().defaultWorkspace, "C:\\custom-workspace");
      assert.equal(readRepos()[0].name, "repo-instalado");
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("usa config local explicita quando GG_USE_LOCAL_CONFIG esta ativo", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gg-local-data-root-"));

  try {
    fs.mkdirSync(path.join(tempRoot, "config"));
    fs.writeFileSync(
      path.join(tempRoot, "config", "settings.json"),
      JSON.stringify({ defaultWorkspace: "C:\\public-workspace" }),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(tempRoot, "config", "settings.local.json"),
      JSON.stringify({ defaultWorkspace: "C:\\private-workspace" }),
      "utf-8"
    );

    withDataRoot(tempRoot, () => {
      withLocalConfig("1", () => {
        assert.equal(resolveConfigPath("settings.json"), path.join(tempRoot, "config", "settings.local.json"));
        assert.equal(readSettings().defaultWorkspace, "C:\\private-workspace");
      });
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("le repositorios e settings do projeto", () => {
  withDataRoot(null, () => {
    const repos = readRepos();
    const settings = readSettings();

    assert.equal(Array.isArray(repos), true);
    assert.equal(repos.some((repo) => repo.name === "git"), true);
    assert.equal(settings.facultyWorkspace, "C:\\.gg\\faculdade");
    assert.equal(settings.defaultGitUser.name, "");
    assert.equal(settings.defaultGitUser.email, "");
  });
});
