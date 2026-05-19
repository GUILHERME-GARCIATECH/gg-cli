import fs from "node:fs";
import { input, select, confirm } from "@inquirer/prompts";
import { readRepos, saveRepos } from "../utils/config.js";
import { ensureWorkspaceDirectory, getRepoPath, getWorkspacePath, isInsidePath } from "../utils/paths.js";
import { runCommand, runCommandResult } from "../utils/shell.js";
import { openRepoWithEditor } from "../utils/editors.js";

const READY = "ready";
const MISSING = "missing";
const NOT_DIRECTORY = "not-directory";
const NOT_GIT = "not-git";
const SAFE_DIRECTORY = "safe-directory";
const UNSAFE_PATH = "unsafe-path";

export function normalizeRepoName(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function isValidGitUrl(url = "") {
  const value = url.trim();
  return (
    value.startsWith("https://github.com/") ||
    value.startsWith("git@github.com:")
  );
}

export function findRepoByName(name) {
  const repos = readRepos();
  return repos.find((repo) => repo.name === name);
}

export function getReposByWorkspace(workspaceName) {
  return readRepos().filter((repo) => (repo.workspace || "default") === workspaceName);
}

export function ensureWorkspaceExists(repo) {
  return ensureWorkspaceDirectory(repo.workspace);
}

function showRepoNotFound(name) {
  console.log(`Repositorio nao encontrado: ${name}`);
  console.log("Use o comando abaixo para ver os repositorios cadastrados:");
  console.log("gg repo list");
}

function classifyGitFailure(output = "") {
  const text = output.toLowerCase();

  if (text.includes("dubious ownership") || text.includes("safe.directory")) {
    return SAFE_DIRECTORY;
  }

  if (text.includes("not a git repository")) {
    return NOT_GIT;
  }

  if (
    text.includes("authentication failed") ||
    text.includes("permission denied") ||
    text.includes("could not read from remote repository") ||
    text.includes("repository not found")
  ) {
    return "auth";
  }

  if (
    text.includes("not possible to fast-forward") ||
    text.includes("divergent") ||
    text.includes("non-fast-forward")
  ) {
    return "fast-forward";
  }

  if (text.includes("local changes") || text.includes("would be overwritten")) {
    return "local-changes";
  }

  return "git-error";
}

function getFailureMessage(reason, repoPath) {
  if (reason === MISSING) {
    return "Repositorio ainda nao foi clonado.";
  }

  if (reason === NOT_DIRECTORY) {
    return "O caminho esperado existe, mas nao e uma pasta.";
  }

  if (reason === NOT_GIT) {
    return "A pasta existe, mas nao parece ser um repositorio Git.";
  }

  if (reason === UNSAFE_PATH) {
    return "O caminho calculado fica fora do workspace configurado.";
  }

  if (reason === SAFE_DIRECTORY) {
    return `Git bloqueou este repositorio por dono diferente. Se confiar nessa pasta, rode: git config --global --add safe.directory "${repoPath}"`;
  }

  if (reason === "auth") {
    return "Falha de autenticacao ou permissao no Git remoto.";
  }

  if (reason === "fast-forward") {
    return "O pull --ff-only foi recusado porque a branch local divergiu da remota.";
  }

  if (reason === "local-changes") {
    return "Existem alteracoes locais que precisam ser commitadas, stashadas ou revisadas.";
  }

  return "Git retornou erro para este repositorio.";
}

export function getRepoLocalState(repo) {
  const repoPath = getRepoPath(repo);
  const workspacePath = getWorkspacePath(repo.workspace);

  if (!isInsidePath(workspacePath, repoPath)) {
    return {
      kind: UNSAFE_PATH,
      repo,
      repoPath,
      ok: false,
      message: getFailureMessage(UNSAFE_PATH, repoPath)
    };
  }

  if (!fs.existsSync(repoPath)) {
    return {
      kind: MISSING,
      repo,
      repoPath,
      ok: false,
      message: getFailureMessage(MISSING, repoPath)
    };
  }

  if (!fs.statSync(repoPath).isDirectory()) {
    return {
      kind: NOT_DIRECTORY,
      repo,
      repoPath,
      ok: false,
      message: getFailureMessage(NOT_DIRECTORY, repoPath)
    };
  }

  const result = runCommandResult("git", ["-C", repoPath, "rev-parse", "--is-inside-work-tree"]);

  if (!result.ok || result.stdout !== "true") {
    const reason = classifyGitFailure(result.output);
    return {
      kind: reason === SAFE_DIRECTORY ? SAFE_DIRECTORY : NOT_GIT,
      repo,
      repoPath,
      ok: false,
      output: result.output,
      message: getFailureMessage(reason === SAFE_DIRECTORY ? SAFE_DIRECTORY : NOT_GIT, repoPath)
    };
  }

  return {
    kind: READY,
    repo,
    repoPath,
    ok: true
  };
}

function printRepoHeader(title, repo, repoPath) {
  console.log("");
  console.log(`${title}: ${repo.name}`);
  console.log(`Pasta: ${repoPath}`);
  console.log("");
}

function printRepoProblem(repo, repoPath, message, output = "") {
  console.log(`[${repo.name}] ${message}`);

  if (output) {
    console.log(output);
  }

  if (repoPath) {
    console.log(`Pasta: ${repoPath}`);
  }
}

function createRepoResult(repo, status, reason, repoPath, details = {}) {
  return {
    repoName: repo.name,
    status,
    reason,
    repoPath,
    ...details
  };
}

export function summarizeRepoResults(results) {
  const ok = results.filter((item) => item.status === "ok");
  const skipped = results.filter((item) => item.status === "skipped");
  const failed = results.filter((item) => item.status === "failed");

  return {
    ok,
    skipped,
    failed
  };
}

function printBatchSummary(title, results) {
  const { ok, skipped, failed } = summarizeRepoResults(results);

  console.log("");
  console.log(`${title} - resumo`);
  console.log(`OK: ${ok.length}`);
  console.log(`Pulados: ${skipped.length}`);
  console.log(`Falhas: ${failed.length}`);

  for (const item of [...skipped, ...failed]) {
    console.log(`- ${item.repoName}: ${item.message || item.reason}`);
  }
}

export function getRepoStatusPorcelain(repoPath) {
  return runCommandResult("git", ["-C", repoPath, "status", "--porcelain"]);
}

export function hasLocalChanges(repoPath) {
  const result = getRepoStatusPorcelain(repoPath);

  return {
    ok: result.ok,
    dirty: Boolean(result.stdout),
    output: result.output,
    status: result.stdout
  };
}

export function cloneRepoIfNeeded(repo) {
  const initialState = getRepoLocalState(repo);
  const repoPath = initialState.repoPath;

  if (initialState.kind === UNSAFE_PATH) {
    printRepoProblem(repo, repoPath, initialState.message);
    return null;
  }

  if (fs.existsSync(repoPath)) {
    const state = initialState;

    if (state.kind === READY || state.kind === SAFE_DIRECTORY) {
      console.log(`Repositorio ja existe em: ${repoPath}`);
      return repoPath;
    }

    printRepoProblem(repo, repoPath, state.message, state.output);
    console.log("Nao vou clonar por cima de uma pasta existente.");
    return null;
  }

  ensureWorkspaceExists(repo);

  console.log(`Clonando ${repo.name}...`);
  console.log(`Destino: ${repoPath}`);

  try {
    runCommand("git", ["clone", repo.url, repoPath]);

    console.log("");
    console.log("Repositorio clonado com sucesso.");
  } catch (error) {
    console.log("");
    console.log(`Nao foi possivel clonar o repositorio: ${repo.name}`);
    console.log(`URL: ${repo.url}`);
    console.log("");
    console.log("Possiveis causas:");
    console.log("- o repositorio nao existe;");
    console.log("- a URL esta errada no config/repos.json;");
    console.log("- o repositorio e privado e o Git nao esta autenticado;");
    console.log("- voce nao tem permissao de acesso.");
    console.log("");
    console.log("Erro:");
    console.log(error.message);
    console.log("");
    console.log("Teste manualmente com:");
    console.log(`git clone ${repo.url}`);
    return null;
  }

  return repoPath;
}

function ensureRepoExistsLocally(repo) {
  const state = getRepoLocalState(repo);

  if (state.kind === MISSING) {
    printRepoProblem(repo, state.repoPath, state.message);
    console.log("Clone primeiro com:");
    console.log(`gg repo clone ${repo.name}`);
    return null;
  }

  if (!state.ok) {
    printRepoProblem(repo, state.repoPath, state.message, state.output);
    return null;
  }

  return state.repoPath;
}

export function listRepos() {
  const repos = readRepos();

  if (repos.length === 0) {
    console.log("Nenhum repositorio cadastrado.");
    return;
  }

  console.log("");
  console.log("Repositorios cadastrados:");
  console.log("");

  for (const repo of repos) {
    console.log(`- ${repo.name}`);
    console.log(`  ${repo.description || "Sem descricao"}`);
    console.log(`  URL: ${repo.url}`);
    console.log(`  Tipo: ${repo.type || "nao informado"}`);
    console.log(`  Workspace: ${repo.workspace || "default"}`);
    console.log(`  Editor padrao: ${repo.defaultEditor || "nao informado"}`);
    console.log(`  Caminho: ${getRepoPath(repo)}`);
    console.log("");
  }
}

export async function addRepoInteractive() {
  const repos = readRepos();

  const name = await input({
    message: "Nome curto do repositorio:",
    validate: (value) => {
      const normalized = normalizeRepoName(value);

      if (!normalized) {
        return "Informe um nome.";
      }

      if (repos.some((repo) => repo.name === normalized)) {
        return "Ja existe um repositorio com esse nome.";
      }

      return true;
    }
  });

  const normalizedName = normalizeRepoName(name);

  const description = await input({
    message: "Descricao:",
    default: ""
  });

  const url = await input({
    message: "URL do Git:",
    validate: (value) => {
      if (!isValidGitUrl(value.trim())) {
        return "Informe uma URL GitHub HTTPS ou SSH valida.";
      }

      return true;
    }
  });

  const type = await select({
    message: "Tipo do projeto:",
    choices: [
      { name: "Node.js", value: "node" },
      { name: "Java", value: "java" },
      { name: "Estudo", value: "study" },
      { name: "Script/Automacao", value: "automation" },
      { name: "Outro", value: "other" }
    ]
  });

  const defaultEditor = await select({
    message: "Editor padrao:",
    choices: [
      { name: "VS Code", value: "vscode" },
      { name: "IntelliJ IDEA", value: "intellij" },
      { name: "Explorer", value: "explorer" },
      { name: "Terminal", value: "terminal" }
    ]
  });

  const workspace = await select({
    message: "Workspace:",
    choices: [
      { name: "Faculdade", value: "faculdade" },
      { name: "Trabalho / padrao", value: "default" }
    ]
  });

  const newRepo = {
    name: normalizedName,
    description,
    url: url.trim(),
    type,
    defaultEditor,
    workspace
  };

  console.log("");
  console.log("Novo repositorio:");
  console.log(JSON.stringify(newRepo, null, 2));
  console.log("");

  const shouldSave = await confirm({
    message: "Salvar este repositorio?",
    default: true
  });

  if (!shouldSave) {
    console.log("Cadastro cancelado.");
    return;
  }

  repos.push(newRepo);
  saveRepos(repos);

  console.log("");
  console.log(`Repositorio cadastrado: ${normalizedName}`);
}

export async function removeRepoInteractive(name) {
  const repos = readRepos();
  const selectedRepo = repos.find((repo) => repo.name === name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return;
  }

  console.log("");
  console.log("Repositorio selecionado:");
  console.log(JSON.stringify(selectedRepo, null, 2));
  console.log("");

  const shouldRemove = await confirm({
    message: "Remover este repositorio do cadastro?",
    default: false
  });

  if (!shouldRemove) {
    console.log("Remocao cancelada.");
    return;
  }

  const updatedRepos = repos.filter((repo) => repo.name !== name);
  saveRepos(updatedRepos);

  console.log(`Repositorio removido do cadastro: ${name}`);
}

export function cloneRepoByName(name) {
  const selectedRepo = findRepoByName(name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return null;
  }

  return cloneRepoIfNeeded(selectedRepo);
}

export function openRepoByName(name, editorOption = null) {
  const selectedRepo = findRepoByName(name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return null;
  }

  const repoPath = cloneRepoIfNeeded(selectedRepo);

  if (!repoPath) {
    return null;
  }

  console.log(`Abrindo ${selectedRepo.name}...`);
  openRepoWithEditor(selectedRepo, repoPath, editorOption);
  return repoPath;
}

export function statusRepo(repo, options = {}) {
  const { print = true } = options;
  const state = getRepoLocalState(repo);

  if (print) {
    printRepoHeader("Status", repo, state.repoPath);
  }

  if (state.kind === MISSING) {
    const message = `${state.message} Use: gg repo clone ${repo.name}`;

    if (print) {
      console.log(message);
    }

    return createRepoResult(repo, "skipped", MISSING, state.repoPath, { message });
  }

  if (!state.ok) {
    if (print) {
      console.log(state.message);

      if (state.output) {
        console.log(state.output);
      }
    }

    return createRepoResult(repo, "failed", state.kind, state.repoPath, {
      message: state.message,
      output: state.output
    });
  }

  const result = runCommandResult("git", ["-C", state.repoPath, "status", "--short"]);

  if (!result.ok) {
    const reason = classifyGitFailure(result.output);
    const message = getFailureMessage(reason, state.repoPath);

    if (print) {
      console.log(message);
      console.log(result.output);
    }

    return createRepoResult(repo, "failed", reason, state.repoPath, {
      message,
      output: result.output
    });
  }

  if (print) {
    console.log(result.stdout || "Sem alteracoes locais.");
  }

  return createRepoResult(repo, "ok", "status", state.repoPath, {
    dirty: Boolean(result.stdout),
    output: result.stdout
  });
}

export function statusRepoByName(name) {
  const selectedRepo = findRepoByName(name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return null;
  }

  return statusRepo(selectedRepo);
}

export function pullRepo(repo, options = {}) {
  const { print = true } = options;
  const state = getRepoLocalState(repo);

  if (print) {
    printRepoHeader("Atualizando", repo, state.repoPath);
  }

  if (state.kind === MISSING) {
    const message = `${state.message} Use: gg repo clone ${repo.name}`;

    if (print) {
      console.log(message);
    }

    return createRepoResult(repo, "skipped", MISSING, state.repoPath, { message });
  }

  if (!state.ok) {
    if (print) {
      console.log(state.message);

      if (state.output) {
        console.log(state.output);
      }
    }

    return createRepoResult(repo, "failed", state.kind, state.repoPath, {
      message: state.message,
      output: state.output
    });
  }

  const localChanges = hasLocalChanges(state.repoPath);

  if (!localChanges.ok) {
    const reason = classifyGitFailure(localChanges.output);
    const message = getFailureMessage(reason, state.repoPath);

    if (print) {
      console.log(message);
      console.log(localChanges.output);
    }

    return createRepoResult(repo, "failed", reason, state.repoPath, {
      message,
      output: localChanges.output
    });
  }

  if (localChanges.dirty) {
    const message = "Pull pulado porque existem alteracoes locais.";

    if (print) {
      console.log(message);
      console.log(localChanges.status);
    }

    return createRepoResult(repo, "skipped", "local-changes", state.repoPath, {
      message,
      output: localChanges.status
    });
  }

  const result = runCommandResult("git", ["-C", state.repoPath, "pull", "--ff-only"]);

  if (!result.ok) {
    const reason = classifyGitFailure(result.output);
    const message = getFailureMessage(reason, state.repoPath);

    if (print) {
      console.log(message);
      console.log(result.output);
    }

    return createRepoResult(repo, "failed", reason, state.repoPath, {
      message,
      output: result.output
    });
  }

  if (print) {
    console.log(result.output || "Repositorio atualizado.");
  }

  return createRepoResult(repo, "ok", "pull", state.repoPath, {
    output: result.output
  });
}

export function pullRepoByName(name) {
  const selectedRepo = findRepoByName(name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return null;
  }

  return pullRepo(selectedRepo);
}

export function statusAllRepos() {
  const repos = readRepos();

  if (repos.length === 0) {
    console.log("Nenhum repositorio cadastrado.");
    return [];
  }

  const results = repos.map((item) => statusRepo(item));
  printBatchSummary("Status de todos", results);
  return results;
}

export function pullAllRepos() {
  const repos = readRepos();

  if (repos.length === 0) {
    console.log("Nenhum repositorio cadastrado.");
    return [];
  }

  const results = repos.map((item) => pullRepo(item));
  printBatchSummary("Atualizacao de todos", results);
  return results;
}

export function doctorRepos() {
  const repos = readRepos();

  if (repos.length === 0) {
    console.log("Nenhum repositorio cadastrado.");
    return [];
  }

  const results = repos.map((repo) => {
    const state = getRepoLocalState(repo);

    console.log("");
    console.log(`${repo.name}`);
    console.log(`URL: ${repo.url}`);
    console.log(`Workspace: ${repo.workspace || "default"}`);
    console.log(`Caminho: ${state.repoPath}`);

    if (state.ok) {
      console.log("Estado: OK");
      return createRepoResult(repo, "ok", READY, state.repoPath);
    }

    console.log(`Estado: ${state.message}`);

    if (state.output) {
      console.log(state.output);
    }

    return createRepoResult(repo, state.kind === MISSING ? "skipped" : "failed", state.kind, state.repoPath, {
      message: state.message,
      output: state.output
    });
  });

  printBatchSummary("Doctor de repositorios", results);
  return results;
}

export function registerRepoCommands(program) {
  const repo = program
    .command("repo")
    .alias("r")
    .description("Gerencia repositorios");

  repo
    .command("list")
    .alias("l")
    .description("Lista os repositorios cadastrados")
    .action(() => {
      listRepos();
    });

  repo
    .command("add")
    .alias("a")
    .description("Adiciona um novo repositorio ao cadastro")
    .action(async () => {
      await addRepoInteractive();
    });

  repo
    .command("remove")
    .alias("rm")
    .description("Remove um repositorio do cadastro")
    .argument("<name>", "Nome do repositorio cadastrado")
    .action(async (name) => {
      await removeRepoInteractive(name);
    });

  repo
    .command("clone")
    .alias("c")
    .description("Clona um repositorio cadastrado")
    .argument("<name>", "Nome do repositorio cadastrado")
    .action((name) => {
      cloneRepoByName(name);
    });

  repo
    .command("open")
    .alias("o")
    .description("Clona se necessario e abre um repositorio")
    .argument("<name>", "Nome do repositorio cadastrado")
    .option("-c, --code", "Abre no VS Code")
    .option("--c", "Abre no VS Code")
    .option("--vscode", "Abre no VS Code")
    .option("-i, --idea", "Abre no IntelliJ IDEA")
    .option("--i", "Abre no IntelliJ IDEA")
    .option("--intellij", "Abre no IntelliJ IDEA")
    .option("-e, --explorer", "Abre no Explorer")
    .option("--e", "Abre no Explorer")
    .option("-t, --terminal", "Abre no terminal")
    .option("--t", "Abre no terminal")
    .action((name, options) => {
      let editorOption = null;

      if (options.code || options.c || options.vscode) {
        editorOption = "vscode";
      }

      if (options.idea || options.i || options.intellij) {
        editorOption = "intellij";
      }

      if (options.terminal || options.t) {
        editorOption = "terminal";
      }

      if (options.explorer || options.e) {
        editorOption = "explorer";
      }

      openRepoByName(name, editorOption);
    });

  repo
    .command("status")
    .alias("st")
    .description("Mostra o status Git de um repositorio")
    .argument("<name>", "Nome do repositorio cadastrado")
    .action((name) => {
      statusRepoByName(name);
    });

  repo
    .command("pull")
    .alias("p")
    .description("Atualiza um repositorio com git pull --ff-only")
    .argument("<name>", "Nome do repositorio cadastrado")
    .action((name) => {
      pullRepoByName(name);
    });

  repo
    .command("status-all")
    .alias("sa")
    .description("Mostra o status Git de todos os repositorios clonados")
    .action(() => {
      statusAllRepos();
    });

  repo
    .command("pull-all")
    .alias("pa")
    .description("Atualiza todos os repositorios clonados com git pull --ff-only")
    .action(() => {
      pullAllRepos();
    });

  repo
    .command("doctor")
    .alias("d")
    .description("Valida cadastro, pastas locais e estado Git dos repositorios")
    .action(() => {
      doctorRepos();
    });
}
