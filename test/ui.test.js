import test from "node:test";
import assert from "node:assert/strict";
import stringWidth from "string-width";
import { createLogo, renderBanner, selectLogoFont } from "../src/ui/banner.js";
import { formatChoiceLabel, ICONS } from "../src/ui/menu.js";
import {
  formatHeaderLinks,
  formatHyperlink,
  getConfiguredLinks,
  openExternalUrl,
  resolveLinks
} from "../src/ui/links.js";
import {
  getBorderStyle,
  isCmdTerminal,
  supportsEmoji,
  supportsHyperlinks
} from "../src/ui/terminal.js";

const ANSI_PATTERN = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g;

function stripAnsi(value) {
  return String(value).replace(ANSI_PATTERN, "");
}

test("banner usa figlet bonito no terminal moderno e fallback ASCII no CMD", () => {
  assert.equal(selectLogoFont({ width: 80, modern: true }), "ANSI Shadow");
  assert.equal(selectLogoFont({ width: 80, modern: false }), "Doom");
  assert.equal(selectLogoFont({ width: 28, modern: true }), "compact");

  assert.match(stripAnsi(createLogo({ width: 80, modern: true })), /██████/);
  assert.match(stripAnsi(createLogo({ width: 80, modern: false })), /_____/);
});

test("banner usa boxen com linhas alinhadas e fallback classic no CMD", () => {
  const output = renderBanner({
    width: 80,
    stdout: { columns: 80, isTTY: true },
    env: { GG_FORCE_CMD_FALLBACK: "1" },
    platform: "win32",
    links: [{ label: "GitHub", url: "https://example.com", configured: true }]
  });
  const lines = stripAnsi(output).split("\n").filter(Boolean);
  const widths = new Set(lines.map((line) => stringWidth(line)));

  assert.equal(widths.size, 1);
  assert.match(lines[0], /\+/);
  assert.match(stripAnsi(output), /Personal Developer CLI/);
});

test("terminal detecta CMD e desativa emoji, hyperlink e borda unicode", () => {
  const options = {
    env: { GG_FORCE_CMD_FALLBACK: "1" },
    stdout: { isTTY: true },
    platform: "win32"
  };

  assert.equal(isCmdTerminal(options.env, options.platform), true);
  assert.equal(supportsEmoji(options), false);
  assert.equal(supportsHyperlinks(options), false);
  assert.equal(getBorderStyle(options), "classic");
});

test("formatacao de menu usa emoji apenas quando o terminal suporta", () => {
  const choice = {
    label: "Repositorios",
    value: "repos",
    icon: ICONS.repos
  };

  assert.equal(formatChoiceLabel(choice, { env: { GG_FORCE_CMD_FALLBACK: "1" }, stdout: { isTTY: true }, platform: "win32" }), "Repositorios");
  assert.match(formatChoiceLabel(choice, { env: { WT_SESSION: "1" }, stdout: { isTTY: true }, platform: "win32" }), /Repositorios/);
  assert.notEqual(formatChoiceLabel(choice, { env: { WT_SESSION: "1" }, stdout: { isTTY: true }, platform: "win32" }), "Repositorios");
});

test("links sao resolvidos de settings e linkedin vazio fica nao configurado", () => {
  const links = resolveLinks({
    settings: {
      ui: {
        links: {
          github: "https://example.com/github",
          linkedin: "",
          project: "https://example.com/project"
        }
      }
    },
    packageInfo: {}
  });

  assert.deepEqual(
    links.map((link) => [link.key, link.configured]),
    [
      ["github", true],
      ["linkedin", false],
      ["project", true]
    ]
  );
  assert.deepEqual(getConfiguredLinks({ settings: { ui: { links: { github: "", linkedin: "", project: "" } } } }), []);
});

test("hyperlinks so aparecem em terminais confiaveis", () => {
  assert.equal(formatHyperlink("GitHub", "https://example.com", {
    env: { GG_FORCE_CMD_FALLBACK: "1" },
    stdout: { isTTY: true },
    platform: "win32"
  }), "GitHub");
  assert.match(formatHeaderLinks([{ label: "GitHub", url: "https://example.com", configured: true }], {
    env: { WT_SESSION: "1" },
    stdout: { isTTY: true },
    platform: "win32"
  }), /\x1B]8;;https:\/\/example\.com/);
});

test("openExternalUrl usa biblioteca open por injecao de opener", async () => {
  const calls = [];
  await openExternalUrl("https://example.com", async (...args) => {
    calls.push(args);
  });

  assert.deepEqual(calls, [["https://example.com", { wait: false }]]);
});
