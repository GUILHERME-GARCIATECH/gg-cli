import os from "node:os";
import { runCommandResult } from "../utils/shell.js";

function formatBytes(value) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = Number(value);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function printCommandOutput(title, command, args) {
  const result = runCommandResult(command, args);

  console.log("");
  console.log(title);

  if (!result.ok) {
    console.log(result.output || `Nao foi possivel executar ${command}.`);
    return result;
  }

  console.log(result.output || "Sem saida.");
  return result;
}

export function pcInfo() {
  const cpus = os.cpus();

  console.log("");
  console.log("Informacoes do PC");
  console.log(`Host: ${os.hostname()}`);
  console.log(`Sistema: ${os.type()} ${os.release()} (${os.platform()})`);
  console.log(`Arquitetura: ${os.arch()}`);
  console.log(`Node.js: ${process.version}`);
  console.log(`CPU: ${cpus[0]?.model || "nao identificada"}`);
  console.log(`Nucleos: ${cpus.length}`);
  console.log(`Memoria total: ${formatBytes(os.totalmem())}`);
  console.log(`Memoria livre: ${formatBytes(os.freemem())}`);
}

export function pcDisk() {
  const result = runCommandResult("wmic", [
    "logicaldisk",
    "get",
    "Caption,FileSystem,FreeSpace,Size"
  ]);

  console.log("");
  console.log("Discos");

  if (result.ok) {
    console.log(result.output || "Sem saida.");
    return result;
  }

  const fallback = runCommandResult("powershell.exe", [
    "-NoProfile",
    "-Command",
    "Get-PSDrive -PSProvider FileSystem | Select-Object Name,Used,Free,Root | Format-Table -AutoSize"
  ]);

  if (!fallback.ok) {
    console.log(fallback.output || result.output || "Nao foi possivel consultar os discos.");
    return fallback;
  }

  console.log(fallback.output || "Sem saida.");
  return fallback;
}

export function pcNetwork() {
  return printCommandOutput("Rede", "ipconfig", ["/all"]);
}

export function pcIp() {
  return printCommandOutput("IP", "ipconfig", []);
}

export function pcDns() {
  return printCommandOutput("DNS", "nslookup", ["google.com"]);
}

export function registerPcCommands(program) {
  const pc = program
    .command("pc")
    .alias("p")
    .description("Diagnosticos simples do computador");

  pc
    .command("info")
    .alias("i")
    .description("Mostra informacoes basicas do sistema")
    .action(() => {
      pcInfo();
    });

  pc
    .command("disco")
    .alias("d")
    .description("Mostra discos locais")
    .action(() => {
      pcDisk();
    });

  pc
    .command("rede")
    .alias("r")
    .description("Mostra configuracao de rede completa")
    .action(() => {
      pcNetwork();
    });

  pc
    .command("ip")
    .alias("a")
    .description("Mostra configuracao IP")
    .action(() => {
      pcIp();
    });

  pc
    .command("dns")
    .alias("n")
    .description("Testa resolucao DNS com nslookup")
    .action(() => {
      pcDns();
    });
}
