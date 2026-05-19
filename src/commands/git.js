import { readSettings } from "../utils/config.js";
import { runCommandResult } from "../utils/shell.js";
import { findRepoByName, getRepoLocalState } from "./repo.js";

function readGitConfig(args) {
  const result = runCommandResult("git", ["config", ...args]);
  return result.ok ? result.stdout : "";
}

function getCurrentRepoRoot() {
  const result = runCommandResult("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd()
  });

  return result.ok ? result.stdout : null;
}

function getDefaultGitUser() {
  const settings = readSettings();
  return settings.defaultGitUser || {};
}

export function configureRepoGitUser(repoPath, gitUser = getDefaultGitUser()) {
  if (!gitUser.name || !gitUser.email) {
    return {
      ok: false,
      message: "defaultGitUser.name e defaultGitUser.email precisam estar configurados em settings.json."
    };
  }

  const nameResult = runCommandResult("git", ["-C", repoPath, "config", "user.name", gitUser.name]);
  const emailResult = runCommandResult("git", ["-C", repoPath, "config", "user.email", gitUser.email]);

  if (!nameResult.ok || !emailResult.ok) {
    return {
      ok: false,
      message: "Nao foi possivel aplicar a configuracao Git local.",
      output: [nameResult.output, emailResult.output].filter(Boolean).join("\n")
    };
  }

  return {
    ok: true,
    message: `Git local configurado como ${gitUser.name} <${gitUser.email}>.`
  };
}

export function gitWhoami() {
  const globalName = readGitConfig(["--global", "user.name"]);
  const globalEmail = readGitConfig(["--global", "user.email"]);
  const repoRoot = getCurrentRepoRoot();

  console.log("");
  console.log("Git global:");
  console.log(`Nome: ${globalName || "nao configurado"}`);
  console.log(`Email: ${globalEmail || "nao configurado"}`);

  if (!repoRoot) {
    console.log("");
    console.log("Git local: este diretorio nao parece estar dentro de um repositorio.");
    return;
  }

  const localName = runCommandResult("git", ["-C", repoRoot, "config", "--local", "user.name"]);
  const localEmail = runCommandResult("git", ["-C", repoRoot, "config", "--local", "user.email"]);

  console.log("");
  console.log("Git local:");
  console.log(`Repositorio: ${repoRoot}`);
  console.log(`Nome: ${localName.ok && localName.stdout ? localName.stdout : "nao configurado"}`);
  console.log(`Email: ${localEmail.ok && localEmail.stdout ? localEmail.stdout : "nao configurado"}`);
}

export function gitConfigLocal(repoName = null) {
  let repoPath = getCurrentRepoRoot();

  if (repoName) {
    const repo = findRepoByName(repoName);

    if (!repo) {
      console.log(`Repositorio nao encontrado: ${repoName}`);
      return {
        ok: false,
        message: "Repositorio nao encontrado."
      };
    }

    const state = getRepoLocalState(repo);

    if (!state.ok) {
      console.log(state.message);

      if (state.output) {
        console.log(state.output);
      }

      return {
        ok: false,
        message: state.message
      };
    }

    repoPath = state.repoPath;
  }

  if (!repoPath) {
    console.log("Este comando precisa ser executado dentro de um repositorio Git ou receber um repo cadastrado.");
    console.log("Exemplo: gg git config-local hello-world");
    return {
      ok: false,
      message: "Repositorio local nao encontrado."
    };
  }

  const result = configureRepoGitUser(repoPath);

  console.log("");
  console.log(`Repositorio: ${repoPath}`);
  console.log(result.message);

  if (!result.ok && result.output) {
    console.log(result.output);
  }

  return result;
}

export function registerGitCommands(program) {
  const git = program
    .command("git")
    .alias("g")
    .description("Utilitarios de configuracao Git");

  git
    .command("whoami")
    .alias("w")
    .description("Mostra usuario Git global e local")
    .action(() => {
      gitWhoami();
    });

  git
    .command("config-local")
    .alias("c")
    .description("Aplica defaultGitUser no repositorio atual ou cadastrado")
    .argument("[repo]", "Nome de um repositorio cadastrado")
    .action((repoName) => {
      gitConfigLocal(repoName);
    });
}
