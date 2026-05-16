import test from "node:test";
import assert from "node:assert/strict";
import { runCommandResult } from "../src/utils/shell.js";

test("runCommandResult captura sucesso", () => {
  const result = runCommandResult(process.execPath, ["--version"]);

  assert.equal(result.ok, true);
  assert.match(result.stdout, /^v\d+\./);
});

test("runCommandResult retorna falha sem lancar excecao", () => {
  const result = runCommandResult(process.execPath, ["-e", "process.exit(7)"]);

  assert.equal(result.ok, false);
  assert.equal(result.status, 7);
});
