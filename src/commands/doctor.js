import fs from "node:fs";
import { getProjectRoot, readRepos, readSettings, resolveProjectPath } from "../utils/config.js";
import { getWorkspacePath } from "../utils/paths.js";
import { runCommandResult } from "../utils/shell.js";
import { doctorRepos } from "./repo.js";

function printCheck(label, ok, detail = "") {
  const marker = ok ? "OK" : "AVISO";
  console.log(`[${marker}] ${label}${detail ? ` - ${detail}` : ""}`);
}

function commandExists(command) {
  const result = runCommandResult("where", [command]);
  return result.ok ? result.stdout.split(/\r?\n/)[0] : "";
}

function checkEditor(name, command) {
  if (!command) {
    printCheck(`Editor ${name}`, false, "nao configurado");
    return;
  }

  if (fs.existsSync(command)) {
    printCheck(`Editor ${name}`, true, command);
    return;
  }

  const found = commandExists(command);
  printCheck(`Editor ${name}`, Boolean(found), found || `comando nao encontrado: ${command}`);
}

export function doctor() {
  const settings = readSettings();
  const repos = readRepos();
  const gitVersion = runCommandResult("git", ["--version"]);
  const nodeVersion = process.version;
  const reposPath = resolveProjectPath("config/repos.json");
  const settingsPath = resolveProjectPath("config/settings.json");
  const defaultWorkspace = getWorkspacePath("default");
  const facultyWorkspace = getWorkspacePath("faculdade");

  console.log("");
  console.log("GG Doctor");
  console.log(`Projeto: ${getProjectRoot()}`);
  console.log("");

  printCheck("Node.js", true, nodeVersion);
  printCheck("Git", gitVersion.ok, gitVersion.output || "git nao encontrado");
  printCheck("config/repos.json", fs.existsSync(reposPath), reposPath);
  printCheck("config/settings.json", fs.existsSync(settingsPath), settingsPath);
  printCheck("Repositorios cadastrados", repos.length > 0, `${repos.length}`);
  printCheck("Workspace padrao", fs.existsSync(defaultWorkspace), defaultWorkspace);
  printCheck("Workspace faculdade", fs.existsSync(facultyWorkspace), facultyWorkspace);

  console.log("");
  console.log("Editores");
  checkEditor("VS Code", settings.editors?.vscode || "code");
  checkEditor("IntelliJ IDEA", settings.editors?.intellij || "idea");

  console.log("");
  console.log("Git padrao");
  printCheck(
    "defaultGitUser",
    Boolean(settings.defaultGitUser?.name && settings.defaultGitUser?.email),
    settings.defaultGitUser?.name && settings.defaultGitUser?.email
      ? `${settings.defaultGitUser.name} <${settings.defaultGitUser.email}>`
      : "nao configurado"
  );

  console.log("");
  doctorRepos();
}

export function registerDoctorCommand(program) {
  program
    .command("doctor")
    .alias("d")
    .description("Executa diagnostico geral da GG CLI")
    .action(() => {
      doctor();
    });
}
