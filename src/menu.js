import { select, input } from "@inquirer/prompts";
import { readRepos } from "./utils/config.js";
import { showScreenTitle, clearScreen } from "./utils/terminal.js";
import {
  listRepos,
  addRepoInteractive,
  removeRepoInteractive,
  cloneRepoByName,
  openRepoByName,
  statusRepoByName,
  pullRepoByName,
  statusAllRepos,
  pullAllRepos,
  doctorRepos
} from "./commands/repo.js";
import { setupFaculty } from "./commands/setup.js";
import { cleanFaculty } from "./commands/clean.js";
import { gitWhoami, gitConfigLocal } from "./commands/git.js";
import { pcInfo, pcDisk, pcNetwork, pcIp, pcDns } from "./commands/pc.js";
import { doctor } from "./commands/doctor.js";
import { getSavedConfigSource, listConfig, runConfigImport, runConfigPush } from "./commands/config.js";

export async function openMainMenu() {
  let running = true;

  while (running) {
    const option = await promptMenu("GG CLI", "O que voce quer fazer?", [
      { name: "Repositorios", value: "repos" },
      { name: "Faculdade", value: "faculty" },
      { name: "Git", value: "git" },
      { name: "Manutencao do PC", value: "pc" },
      { name: "Configuracoes", value: "settings" },
      { name: "Doctor", value: "doctor" },
      { name: "Sair", value: "exit" }
    ]);

    if (option === "repos") {
      await openRepoMenu();
    }

    if (option === "faculty") {
      await openFacultyMenu();
    }

    if (option === "git") {
      await openGitMenu();
    }

    if (option === "pc") {
      await openPcMenu();
    }

    if (option === "settings") {
      await openConfigMenu();
    }

    if (option === "doctor") {
      await runAction("Doctor", () => doctor());
    }

    if (option === "exit") {
      running = false;
      clearScreen();
    }
  }
}

async function openConfigMenu() {
  let running = true;

  while (running) {
    const option = await promptMenu("Configuracoes", "Escolha uma acao:", [
      { name: "Listar configuracoes", value: "list" },
      { name: "Importar de repo privado", value: "import" },
      { name: "Subir para repo privado", value: "push" },
      { name: "Voltar", value: "back" }
    ]);

    if (option === "list") {
      await runAction("Configuracoes - listar", () => listConfig());
    }

    if (option === "import") {
      await runAction("Configuracoes - importar", async () => {
        await runConfigImportFromMenu();
      });
    }

    if (option === "push") {
      await runAction("Configuracoes - subir", async () => {
        await runConfigPushFromMenu();
      });
    }

    if (option === "back") {
      running = false;
    }
  }
}

async function openRepoMenu() {
  let running = true;

  while (running) {
    const option = await promptMenu("Repositorios", "O que voce quer fazer?", [
      { name: "Listar repositorios", value: "list" },
      { name: "Adicionar repositorio", value: "add" },
      { name: "Remover repositorio", value: "remove" },
      { name: "Clonar repositorio", value: "clone" },
      { name: "Abrir repositorio", value: "open" },
      { name: "Ver status de um repositorio", value: "status" },
      { name: "Atualizar um repositorio", value: "pull" },
      { name: "Ver status de todos", value: "status-all" },
      { name: "Atualizar todos", value: "pull-all" },
      { name: "Doctor de repositorios", value: "doctor" },
      { name: "Voltar", value: "back" }
    ]);

    if (option === "list") {
      await runAction("Repositorios - listar", () => listRepos());
    }

    if (option === "add") {
      await runAction("Repositorios - adicionar", async () => {
        await addRepoInteractive();
      });
    }

    if (option === "remove") {
      await runRepoSelectionAction("Repositorios - remover", async (repoName) => {
        await removeRepoInteractive(repoName);
      });
    }

    if (option === "clone") {
      await runRepoSelectionAction("Repositorios - clonar", (repoName) => {
        cloneRepoByName(repoName);
      });
    }

    if (option === "open") {
      await runOpenRepoAction();
    }

    if (option === "status") {
      await runRepoSelectionAction("Repositorios - status", (repoName) => {
        statusRepoByName(repoName);
      });
    }

    if (option === "pull") {
      await runRepoSelectionAction("Repositorios - atualizar", (repoName) => {
        pullRepoByName(repoName);
      });
    }

    if (option === "status-all") {
      await runAction("Repositorios - status de todos", () => statusAllRepos());
    }

    if (option === "pull-all") {
      await runAction("Repositorios - atualizar todos", () => pullAllRepos());
    }

    if (option === "doctor") {
      await runAction("Repositorios - doctor", () => doctorRepos());
    }

    if (option === "back") {
      running = false;
    }
  }
}

async function openFacultyMenu() {
  let running = true;

  while (running) {
    const option = await promptMenu("Faculdade", "Escolha uma acao:", [
      { name: "Setup faculdade", value: "setup" },
      { name: "Limpar faculdade", value: "clean" },
      { name: "Voltar", value: "back" }
    ]);

    if (option === "setup") {
      await runAction("Faculdade - setup", () => setupFaculty());
    }

    if (option === "clean") {
      await runAction("Faculdade - limpeza", async () => {
        await cleanFaculty();
      });
    }

    if (option === "back") {
      running = false;
    }
  }
}

async function openGitMenu() {
  let running = true;

  while (running) {
    const option = await promptMenu("Git", "Escolha uma acao:", [
      { name: "Whoami", value: "whoami" },
      { name: "Configurar Git local no diretorio atual", value: "config-current" },
      { name: "Configurar Git local em repo cadastrado", value: "config-repo" },
      { name: "Voltar", value: "back" }
    ]);

    if (option === "whoami") {
      await runAction("Git - whoami", () => gitWhoami());
    }

    if (option === "config-current") {
      await runAction("Git - config local", () => gitConfigLocal());
    }

    if (option === "config-repo") {
      await runRepoSelectionAction("Git - config local em repo", (repoName) => {
        gitConfigLocal(repoName);
      });
    }

    if (option === "back") {
      running = false;
    }
  }
}

async function openPcMenu() {
  let running = true;

  while (running) {
    const option = await promptMenu("Manutencao do PC", "Escolha uma acao:", [
      { name: "Info", value: "info" },
      { name: "Disco", value: "disk" },
      { name: "Rede completa", value: "network" },
      { name: "IP", value: "ip" },
      { name: "DNS", value: "dns" },
      { name: "Voltar", value: "back" }
    ]);

    if (option === "info") {
      await runAction("PC - info", () => pcInfo());
    }

    if (option === "disk") {
      await runAction("PC - disco", () => pcDisk());
    }

    if (option === "network") {
      await runAction("PC - rede", () => pcNetwork());
    }

    if (option === "ip") {
      await runAction("PC - ip", () => pcIp());
    }

    if (option === "dns") {
      await runAction("PC - dns", () => pcDns());
    }

    if (option === "back") {
      running = false;
    }
  }
}

async function promptMenu(title, message, choices) {
  showScreenTitle(title);
  return await select({ message, choices });
}

async function runAction(title, action) {
  showScreenTitle(title);
  await action();
  await pause();
}

async function runRepoSelectionAction(title, action) {
  showScreenTitle(title);
  const repoName = await selectRepoName();

  if (repoName) {
    showScreenTitle(`${title}: ${repoName}`);
    await action(repoName);
  }

  await pause();
}

async function runOpenRepoAction() {
  showScreenTitle("Repositorios - abrir");
  const repoName = await selectRepoName();

  if (repoName) {
    const editor = await select({
      message: "Como deseja abrir?",
      choices: [
        { name: "Editor padrao do repositorio", value: null },
        { name: "VS Code", value: "vscode" },
        { name: "IntelliJ IDEA", value: "intellij" },
        { name: "Explorer", value: "explorer" },
        { name: "Terminal", value: "terminal" }
      ]
    });

    showScreenTitle(`Repositorios - abrir: ${repoName}`);
    openRepoByName(repoName, editor);
  }

  await pause();
}

async function readConfigSourceFromMenu() {
  const savedSource = getSavedConfigSource();
  const source = await input({
    message: "Repo privado ou pasta local:",
    default: savedSource?.source || ""
  });

  return source.trim() || null;
}

async function runConfigImportFromMenu() {
  try {
    await runConfigImport(await readConfigSourceFromMenu());
  } catch (error) {
    console.log(error?.message || error);
  }
}

async function runConfigPushFromMenu() {
  try {
    await runConfigPush(await readConfigSourceFromMenu());
  } catch (error) {
    console.log(error?.message || error);
  }
}

async function selectRepoName() {
  const repos = readRepos();

  if (repos.length === 0) {
    console.log("Nenhum repositorio cadastrado.");
    return null;
  }

  return await select({
    message: "Escolha um repositorio:",
    choices: repos.map((repo) => ({
      name: `${repo.name} - ${repo.description || "Sem descricao"}`,
      value: repo.name
    }))
  });
}

async function pause() {
  await input({
    message: "Pressione Enter para continuar..."
  });
  clearScreen();
}
