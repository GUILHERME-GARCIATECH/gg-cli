import { spawnSync } from "node:child_process";

let cachedWindowsProcessNames = null;

function getWindowsProcessNames() {
  if (cachedWindowsProcessNames !== null) {
    return cachedWindowsProcessNames;
  }

  const script = [
    `$processId = ${process.pid}`,
    "$names = @()",
    "for ($i = 0; $i -lt 5 -and $processId; $i++) {",
    "  $process = Get-CimInstance Win32_Process -Filter \"ProcessId=$processId\"",
    "  if (-not $process) { break }",
    "  $names += $process.Name",
    "  $processId = $process.ParentProcessId",
    "}",
    "$names -join ','"
  ].join("; ");

  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", script], {
    encoding: "utf-8",
    timeout: 800,
    windowsHide: true
  });

  if (result.error || result.status !== 0) {
    cachedWindowsProcessNames = [];
    return cachedWindowsProcessNames;
  }

  cachedWindowsProcessNames = result.stdout
    .trim()
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  return cachedWindowsProcessNames;
}

export function isCmdTerminal(env = process.env, platform = process.platform) {
  if (env.GG_FORCE_CMD_FALLBACK === "1") {
    return true;
  }

  if (env.GG_DISABLE_CMD_FALLBACK === "1") {
    return false;
  }

  if (platform !== "win32") {
    return false;
  }

  const processNames = getWindowsProcessNames();

  return processNames.includes("cmd.exe") &&
    !processNames.some((name) => name === "powershell.exe" || name === "pwsh.exe");
}

export function getTerminalWidth(stdout = process.stdout, env = process.env) {
  const columns = Number(stdout?.columns || env.COLUMNS || 80);
  return Number.isFinite(columns) ? Math.max(24, columns) : 80;
}

export function isModernTerminal({
  env = process.env,
  stdout = process.stdout,
  platform = process.platform
} = {}) {
  if (!stdout?.isTTY || isCmdTerminal(env, platform)) {
    return false;
  }

  if (platform !== "win32") {
    return true;
  }

  return Boolean(
    env.WT_SESSION ||
    env.TERM_PROGRAM ||
    env.ConEmuANSI === "ON" ||
    env.ANSICON ||
    env.PSModulePath
  );
}

export function supportsEmoji(options = {}) {
  const env = options.env || process.env;

  if (env.GG_NO_EMOJI === "1") {
    return false;
  }

  if (env.GG_FORCE_EMOJI === "1") {
    return true;
  }

  return isModernTerminal(options);
}

export function supportsHyperlinks({
  env = process.env,
  stdout = process.stdout,
  platform = process.platform
} = {}) {
  if (env.GG_NO_HYPERLINKS === "1" || !stdout?.isTTY || isCmdTerminal(env, platform)) {
    return false;
  }

  if (env.WT_SESSION || env.VTE_VERSION || env.DOMTERM) {
    return true;
  }

  return ["iTerm.app", "WezTerm", "vscode", "Hyper"].includes(env.TERM_PROGRAM || "");
}

export function getBorderStyle(options = {}) {
  return isModernTerminal(options) ? "round" : "classic";
}
