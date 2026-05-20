import { readRepos } from "./utils/config.js";
import { showScreenTitle, clearScreen } from "./utils/terminal.js";
import { printBanner } from "./ui/banner.js";
import { openExternalUrl, resolveLinks } from "./ui/links.js";
import {
  ICONS,
  MENU_EXIT,
  isMenuBack,
  isMenuExit,
  promptInput,
  promptMenu as promptUiMenu
} from "./ui/menu.js";
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
      menuChoice("Repositorios", "repos", ICONS.repos),
      menuChoice("Faculdade", "faculty", ICONS.faculty),
      menuChoice("Git", "git", ICONS.git),
      menuChoice("Manutencao do PC", "pc", ICONS.pc),
      menuChoice("Configuracoes", "settings", ICONS.settings),
      menuChoice("Doctor", "doctor", ICONS.doctor),
      menuChoice("Links", "links", ICONS.links),
      menuChoice("Sair", "exit", ICONS.exit)
    ], { main: true, allowBack: false });

    if (isMenuExit(option) || option === "exit") {
      running = false;
      clearScreen();
      continue;
    }

    const result = await runMainOption(option);

    if (isMenuExit(result)) {
      running = false;
      clearScreen();
    }
  }
}

async function runMainOption(option) {
  if (option === "repos") {
    return await openRepoMenu();
  }

  if (option === "faculty") {
    return await openFacultyMenu();
  }

  if (option === "git") {
    return await openGitMenu();
  }

  if (option === "pc") {
    return await openPcMenu();
  }

  if (option === "links") {
    return await openLinksMenu();
  }

  if (option === "settings") {
    return await openConfigMenu();
  }

  if (option === "doctor") {
    return await runAction("Doctor", () => doctor());
  }

  return null;
}

async function openConfigMenu() {
  while (true) {
    const option = await promptMenu("Configuracoes", "Escolha uma acao:", [
      menuChoice("Listar configuracoes", "list"),
      menuChoice("Importar de repo privado", "import"),
      menuChoice("Subir para repo privado", "push"),
      backChoice()
    ]);

    if (isCloseSubmenuOption(option)) {
      return option === MENU_EXIT ? MENU_EXIT : null;
    }

    if (option === "list" && isMenuExit(await runAction("Configuracoes - listar", () => listConfig()))) {
      return MENU_EXIT;
    }

    if (option === "import" && isMenuExit(await runAction("Configuracoes - importar", runConfigImportFromMenu))) {
      return MENU_EXIT;
    }

    if (option === "push" && isMenuExit(await runAction("Configuracoes - subir", runConfigPushFromMenu))) {
      return MENU_EXIT;
    }
  }
}

async function openRepoMenu() {
  while (true) {
    const option = await promptMenu("Repositorios", "O que voce quer fazer?", [
      menuChoice("Listar repositorios", "list"),
      menuChoice("Adicionar repositorio", "add"),
      menuChoice("Remover repositorio", "remove"),
      menuChoice("Clonar repositorio", "clone"),
      menuChoice("Abrir repositorio", "open"),
      menuChoice("Ver status de um repositorio", "status"),
      menuChoice("Atualizar um repositorio", "pull"),
      menuChoice("Ver status de todos", "status-all"),
      menuChoice("Atualizar todos", "pull-all"),
      menuChoice("Doctor de repositorios", "doctor"),
      backChoice()
    ]);

    if (isCloseSubmenuOption(option)) {
      return option === MENU_EXIT ? MENU_EXIT : null;
    }

    if (option === "list" && isMenuExit(await runAction("Repositorios - listar", () => listRepos()))) {
      return MENU_EXIT;
    }

    if (option === "add" && isMenuExit(await runAction("Repositorios - adicionar", addRepoInteractive))) {
      return MENU_EXIT;
    }

    if (option === "remove" && isMenuExit(await runRepoSelectionAction("Repositorios - remover", async (repoName) => {
      await removeRepoInteractive(repoName);
    }))) {
      return MENU_EXIT;
    }

    if (option === "clone" && isMenuExit(await runRepoSelectionAction("Repositorios - clonar", (repoName) => {
      cloneRepoByName(repoName);
    }))) {
      return MENU_EXIT;
    }

    if (option === "open" && isMenuExit(await runOpenRepoAction())) {
      return MENU_EXIT;
    }

    if (option === "status" && isMenuExit(await runRepoSelectionAction("Repositorios - status", (repoName) => {
      statusRepoByName(repoName);
    }))) {
      return MENU_EXIT;
    }

    if (option === "pull" && isMenuExit(await runRepoSelectionAction("Repositorios - atualizar", (repoName) => {
      pullRepoByName(repoName);
    }))) {
      return MENU_EXIT;
    }

    if (option === "status-all" && isMenuExit(await runAction("Repositorios - status de todos", () => statusAllRepos()))) {
      return MENU_EXIT;
    }

    if (option === "pull-all" && isMenuExit(await runAction("Repositorios - atualizar todos", () => pullAllRepos()))) {
      return MENU_EXIT;
    }

    if (option === "doctor" && isMenuExit(await runAction("Repositorios - doctor", () => doctorRepos()))) {
      return MENU_EXIT;
    }
  }
}

async function openFacultyMenu() {
  while (true) {
    const option = await promptMenu("Faculdade", "Escolha uma acao:", [
      menuChoice("Setup faculdade", "setup"),
      menuChoice("Limpar faculdade", "clean"),
      backChoice()
    ]);

    if (isCloseSubmenuOption(option)) {
      return option === MENU_EXIT ? MENU_EXIT : null;
    }

    if (option === "setup" && isMenuExit(await runAction("Faculdade - setup", () => setupFaculty()))) {
      return MENU_EXIT;
    }

    if (option === "clean" && isMenuExit(await runAction("Faculdade - limpeza", cleanFaculty))) {
      return MENU_EXIT;
    }
  }
}

async function openGitMenu() {
  while (true) {
    const option = await promptMenu("Git", "Escolha uma acao:", [
      menuChoice("Whoami", "whoami"),
      menuChoice("Configurar Git local no diretorio atual", "config-current"),
      menuChoice("Configurar Git local em repo cadastrado", "config-repo"),
      backChoice()
    ]);

    if (isCloseSubmenuOption(option)) {
      return option === MENU_EXIT ? MENU_EXIT : null;
    }

    if (option === "whoami" && isMenuExit(await runAction("Git - whoami", () => gitWhoami()))) {
      return MENU_EXIT;
    }

    if (option === "config-current" && isMenuExit(await runAction("Git - config local", () => gitConfigLocal()))) {
      return MENU_EXIT;
    }

    if (option === "config-repo" && isMenuExit(await runRepoSelectionAction("Git - config local em repo", (repoName) => {
      gitConfigLocal(repoName);
    }))) {
      return MENU_EXIT;
    }
  }
}

async function openPcMenu() {
  while (true) {
    const option = await promptMenu("Manutencao do PC", "Escolha uma acao:", [
      menuChoice("Info", "info"),
      menuChoice("Disco", "disk"),
      menuChoice("Rede completa", "network"),
      menuChoice("IP", "ip"),
      menuChoice("DNS", "dns"),
      backChoice()
    ]);

    if (isCloseSubmenuOption(option)) {
      return option === MENU_EXIT ? MENU_EXIT : null;
    }

    if (option === "info" && isMenuExit(await runAction("PC - info", () => pcInfo()))) {
      return MENU_EXIT;
    }

    if (option === "disk" && isMenuExit(await runAction("PC - disco", () => pcDisk()))) {
      return MENU_EXIT;
    }

    if (option === "network" && isMenuExit(await runAction("PC - rede", () => pcNetwork()))) {
      return MENU_EXIT;
    }

    if (option === "ip" && isMenuExit(await runAction("PC - ip", () => pcIp()))) {
      return MENU_EXIT;
    }

    if (option === "dns" && isMenuExit(await runAction("PC - dns", () => pcDns()))) {
      return MENU_EXIT;
    }
  }
}

async function openLinksMenu() {
  while (true) {
    const links = resolveLinks();
    const option = await promptMenu("Links", "Escolha um link para abrir:", [
      ...links.map((link) => ({
        ...menuChoice(link.configured ? `Abrir ${link.label}` : `${link.label} nao configurado`, link.key, ICONS.open),
        disabled: link.configured ? false : "configure em settings.json"
      })),
      backChoice()
    ]);

    if (isCloseSubmenuOption(option)) {
      return option === MENU_EXIT ? MENU_EXIT : null;
    }

    const selectedLink = links.find((link) => link.key === option);

    if (!selectedLink) {
      continue;
    }

    const result = await runAction(`Links - ${selectedLink.label}`, async () => {
      console.log(`Abrindo ${selectedLink.label}: ${selectedLink.url}`);
      await openExternalUrl(selectedLink.url);
    });

    if (isMenuExit(result)) {
      return MENU_EXIT;
    }
  }
}

function menuChoice(label, value, icon = null) {
  return {
    label,
    value,
    icon
  };
}

function backChoice() {
  return menuChoice("Voltar", "back", ICONS.back);
}

function isCloseSubmenuOption(option) {
  return isMenuExit(option) || isMenuBack(option) || option === "back";
}

async function promptMenu(title, message, choices, options = {}) {
  return await promptUiMenu({
    title,
    message,
    choices,
    allowBack: options.allowBack ?? !options.main,
    renderHeader: options.main ? () => printBanner() : null
  });
}

function isPromptExitError(error) {
  return ["ExitPromptError", "CancelPromptError", "AbortPromptError"].includes(error?.name);
}

async function runAction(title, action) {
  showScreenTitle(title);

  try {
    const result = await action();

    if (isMenuExit(result)) {
      return MENU_EXIT;
    }
  } catch (error) {
    if (isPromptExitError(error)) {
      return MENU_EXIT;
    }

    throw error;
  }

  return await pause();
}

async function runRepoSelectionAction(title, action) {
  const repoName = await selectRepoName(title);

  if (isMenuExit(repoName)) {
    return MENU_EXIT;
  }

  if (isMenuBack(repoName) || !repoName) {
    return null;
  }

  showScreenTitle(`${title}: ${repoName}`);

  try {
    await action(repoName);
  } catch (error) {
    if (isPromptExitError(error)) {
      return MENU_EXIT;
    }

    throw error;
  }

  return await pause();
}

async function runOpenRepoAction() {
  const repoName = await selectRepoName("Repositorios - abrir");

  if (isMenuExit(repoName)) {
    return MENU_EXIT;
  }

  if (isMenuBack(repoName) || !repoName) {
    return null;
  }

  const editor = await promptMenu("Repositorios - abrir", "Como deseja abrir?", [
    menuChoice("Editor padrao do repositorio", null),
    menuChoice("VS Code", "vscode"),
    menuChoice("IntelliJ IDEA", "intellij"),
    menuChoice("Explorer", "explorer"),
    menuChoice("Terminal", "terminal"),
    backChoice()
  ]);

  if (isMenuExit(editor)) {
    return MENU_EXIT;
  }

  if (isMenuBack(editor) || editor === "back") {
    return null;
  }

  showScreenTitle(`Repositorios - abrir: ${repoName}`);
  openRepoByName(repoName, editor);

  return await pause();
}

async function readConfigSourceFromMenu() {
  const savedSource = getSavedConfigSource();
  const source = await promptInput({
    message: "Repo privado ou pasta local:",
    defaultValue: savedSource?.source || ""
  });

  if (isMenuExit(source)) {
    return MENU_EXIT;
  }

  return source.trim() || null;
}

async function runConfigImportFromMenu() {
  const source = await readConfigSourceFromMenu();

  if (isMenuExit(source)) {
    return MENU_EXIT;
  }

  try {
    await runConfigImport(source);
  } catch (error) {
    console.log(error?.message || error);
  }

  return null;
}

async function runConfigPushFromMenu() {
  const source = await readConfigSourceFromMenu();

  if (isMenuExit(source)) {
    return MENU_EXIT;
  }

  try {
    await runConfigPush(source);
  } catch (error) {
    console.log(error?.message || error);
  }

  return null;
}

async function selectRepoName(title = "Repositorios") {
  const repos = readRepos();

  if (repos.length === 0) {
    showScreenTitle(title);
    console.log("Nenhum repositorio cadastrado.");
    const pauseResult = await pause();
    return isMenuExit(pauseResult) ? MENU_EXIT : null;
  }

  return await promptMenu(title, "Escolha um repositorio:", repos.map((repo) => ({
    name: `${repo.name} - ${repo.description || "Sem descricao"}`,
    value: repo.name
  })));
}

async function pause() {
  const result = await promptInput({
    message: "Pressione Enter para continuar..."
  });

  clearScreen();
  return isMenuExit(result) ? MENU_EXIT : null;
}
