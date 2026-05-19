import test from "node:test";
import assert from "node:assert/strict";
import { translateAliases } from "../src/utils/aliases.js";

function translate(userArgs) {
  return translateAliases(["node", "src/index.js", ...userArgs]).slice(2);
}

test("traduz alias compacto com hifen para repo list", () => {
  assert.deepEqual(translate(["-rl"]), ["repo", "list"]);
});

test("traduz alias compacto sem hifen para repo open", () => {
  assert.deepEqual(
    translate(["ro", "hello-world", "--c"]),
    ["repo", "open", "hello-world", "--code"]
  );
});

test("traduz alias compacto com hifen e opcao curta longa", () => {
  assert.deepEqual(
    translate(["-ro", "hello-world", "--c"]),
    ["repo", "open", "hello-world", "--code"]
  );
});

test("mantem aliases desconhecidos para o Commander decidir", () => {
  assert.deepEqual(translate(["-xyz", "abc"]), ["-xyz", "abc"]);
});
