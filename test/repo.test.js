import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidGitUrl,
  normalizeRepoName,
  statusRepo,
  summarizeRepoResults
} from "../src/commands/repo.js";

test("normaliza nomes de repositorio", () => {
  assert.equal(normalizeRepoName(" Meu Projeto Legal "), "meu-projeto-legal");
  assert.equal(normalizeRepoName("API   Estudos"), "api-estudos");
});

test("valida URLs GitHub aceitas pelo cadastro", () => {
  assert.equal(isValidGitUrl("https://github.com/user/repo.git"), true);
  assert.equal(isValidGitUrl("git@github.com:user/repo.git"), true);
  assert.equal(isValidGitUrl("https://gitlab.com/user/repo.git"), false);
  assert.equal(isValidGitUrl("not-a-url"), false);
});

test("resume resultados de lote sem depender de Git real", () => {
  const summary = summarizeRepoResults([
    { repoName: "a", status: "ok" },
    { repoName: "b", status: "skipped" },
    { repoName: "c", status: "failed" }
  ]);

  assert.equal(summary.ok.length, 1);
  assert.equal(summary.skipped.length, 1);
  assert.equal(summary.failed.length, 1);
});

test("status de repo ausente nao lanca excecao", () => {
  const result = statusRepo({
    name: `repo-ausente-${Date.now()}`,
    url: "https://github.com/user/repo.git",
    workspace: "default"
  }, { print: false });

  assert.equal(result.status, "skipped");
  assert.equal(result.reason, "missing");
});

test("status bloqueia caminho fora do workspace", () => {
  const result = statusRepo({
    name: "..",
    url: "https://github.com/user/repo.git",
    workspace: "default"
  }, { print: false });

  assert.equal(result.status, "failed");
  assert.equal(result.reason, "unsafe-path");
});
