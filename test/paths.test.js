import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  DEFAULT_FACULTY_WORKSPACE,
  DEFAULT_WORKSPACE,
  getWorkspacePath,
  isInsidePath,
  isSameOrInsidePath
} from "../src/utils/paths.js";

function withDataRoot(value, callback) {
  const previousValue = process.env.GG_DATA_ROOT;
  process.env.GG_DATA_ROOT = value;

  try {
    callback();
  } finally {
    if (previousValue === undefined) {
      delete process.env.GG_DATA_ROOT;
    } else {
      process.env.GG_DATA_ROOT = previousValue;
    }
  }
}

test("valida caminhos dentro de um workspace", () => {
  const workspace = path.resolve("C:/.gg/faculdade");
  const repo = path.join(workspace, "hello-world");

  assert.equal(isInsidePath(workspace, repo), true);
  assert.equal(isSameOrInsidePath(workspace, workspace), true);
  assert.equal(isInsidePath(workspace, path.resolve("C:/outro")), false);
});

test("usa workspaces padrao dentro de C:/.gg quando settings nao define caminhos", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gg-empty-data-root-"));

  try {
    withDataRoot(tempRoot, () => {
      assert.equal(getWorkspacePath("default"), DEFAULT_WORKSPACE);
      assert.equal(getWorkspacePath("faculdade"), DEFAULT_FACULTY_WORKSPACE);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
