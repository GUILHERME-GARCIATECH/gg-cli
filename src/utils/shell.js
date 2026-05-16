import { spawnSync, spawn } from "node:child_process";

function normalizeOutput(value) {
  return String(value || "").trim();
}

export function formatCommand(command, args = []) {
  return [command, ...args].join(" ");
}

export function runCommand(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Comando falhou: ${command} ${args.join(" ")}`);
  }

  return result;
}

export function runCommandResult(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    shell: false,
    ...options
  });

  const stdout = normalizeOutput(result.stdout);
  const stderr = normalizeOutput(result.stderr);
  const status = typeof result.status === "number" ? result.status : 1;

  return {
    ok: !result.error && status === 0,
    command,
    args,
    status,
    stdout,
    stderr,
    error: result.error || null,
    output: [stdout, stderr].filter(Boolean).join("\n")
  };
}

export function runCommandQuiet(command, args = [], options = {}) {
  const result = runCommandResult(command, args, options);

  if (!result.ok) {
    const message = result.error?.message || result.stderr || result.stdout || "erro desconhecido";
    throw new Error(`Comando falhou: ${formatCommand(command, args)}\n${message}`);
  }

  return result;
}

export function runCommandDetached(command, args = [], options = {}) {
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
    shell: false,
    ...options
  });

  child.on("error", (error) => {
    console.log(`Não foi possível executar: ${command}`);
    console.log(`Erro: ${error.message}`);
  });

  child.unref();

  return child;
}
