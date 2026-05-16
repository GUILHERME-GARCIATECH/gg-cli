import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { isInsidePath, isSameOrInsidePath } from "../src/utils/paths.js";

test("valida caminhos dentro de um workspace", () => {
  const workspace = path.resolve("C:/gg-faculdade");
  const repo = path.join(workspace, "dev-study-roadmap");

  assert.equal(isInsidePath(workspace, repo), true);
  assert.equal(isSameOrInsidePath(workspace, workspace), true);
  assert.equal(isInsidePath(workspace, path.resolve("C:/outro")), false);
});
