import { spawnSync, spawn } from "node:child_process";

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