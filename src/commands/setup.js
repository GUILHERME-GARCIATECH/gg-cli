import { ensureWorkspaceDirectory, getWorkspacePath } from "../utils/paths.js";
import {
  cloneRepoIfNeeded,
  getRepoLocalState,
  getReposByWorkspace
} from "./repo.js";
import { configureRepoGitUser } from "./git.js";
import { readSettings } from "../utils/config.js";

export function setupFaculty() {
  const settings = readSettings();
  const workspacePath = getWorkspacePath("faculdade");
  const repos = getReposByWorkspace("faculdade");

  console.log("");
  console.log("Setup faculdade");
  console.log(`Workspace: ${workspacePath}`);

  ensureWorkspaceDirectory("faculdade");

  if (repos.length === 0) {
    console.log("Nenhum repositorio com workspace \"faculdade\" foi encontrado.");
    return [];
  }

  const results = [];

  for (const repo of repos) {
    console.log("");
    console.log(`Preparando ${repo.name}...`);

    const repoPath = cloneRepoIfNeeded(repo);

    if (!repoPath) {
      results.push({
        repoName: repo.name,
        status: "failed",
        message: "Nao foi possivel clonar ou validar o repositorio."
      });
      continue;
    }

    const state = getRepoLocalState(repo);

    if (!state.ok) {
      console.log(state.message);
      results.push({
        repoName: repo.name,
        status: "failed",
        message: state.message
      });
      continue;
    }

    if (settings.defaultGitUser?.name && settings.defaultGitUser?.email) {
      const gitResult = configureRepoGitUser(state.repoPath, settings.defaultGitUser);
      console.log(gitResult.message);

      if (!gitResult.ok) {
        results.push({
          repoName: repo.name,
          status: "failed",
          message: gitResult.message
        });
        continue;
      }
    }

    results.push({
      repoName: repo.name,
      status: "ok",
      message: "Pronto"
    });
  }

  const okCount = results.filter((item) => item.status === "ok").length;
  const failCount = results.length - okCount;

  console.log("");
  console.log("Setup faculdade - resumo");
  console.log(`OK: ${okCount}`);
  console.log(`Falhas: ${failCount}`);

  for (const item of results.filter((result) => result.status !== "ok")) {
    console.log(`- ${item.repoName}: ${item.message}`);
  }

  return results;
}

export function registerSetupCommands(program) {
  const setup = program
    .command("setup")
    .alias("s")
    .description("Prepara ambientes de estudo e trabalho");

  setup
    .command("faculdade")
    .alias("f")
    .description("Cria workspace da faculdade, clona repos e aplica Git local")
    .action(() => {
      setupFaculty();
    });
}
