import { spawn } from "node:child_process";
import { runCommandDetached } from "./shell.js";

function startWindowsProgram(command, args = []) {
  const child = spawn("cmd.exe", ["/c", "start", "", command, ...args], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });

  child.on("error", (error) => {
    console.log(`Não foi possível abrir: ${command}`);
    console.log(`Erro: ${error.message}`);
  });

  child.unref();

  return child;
}

export function openInVSCode(repoPath) {
  startWindowsProgram("code", [repoPath]);
}

export function openInExplorer(repoPath) {
  startWindowsProgram("explorer.exe", [repoPath]);
}

export function openInTerminal(repoPath) {
  startWindowsProgram("cmd.exe", ["/k", `cd /d "${repoPath}"`]);
}

export function openInIntelliJ(repoPath) {
  startWindowsProgram("idea", [repoPath]);
}

export function openRepoWithEditor(repo, repoPath, editorOption) {
  const selectedEditor = editorOption || repo.defaultEditor || "explorer";

  if (selectedEditor === "code" || selectedEditor === "vscode") {
    openInVSCode(repoPath);
    return;
  }

  if (selectedEditor === "idea" || selectedEditor === "intellij") {
    openInIntelliJ(repoPath);
    return;
  }

  if (selectedEditor === "terminal") {
    openInTerminal(repoPath);
    return;
  }

  openInExplorer(repoPath);
}