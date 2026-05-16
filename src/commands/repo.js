import fs from "node:fs";
import { input, select, confirm } from "@inquirer/prompts";
import { readRepos, saveRepos } from "../utils/config.js";
import { getRepoPath, getWorkspacePath } from "../utils/paths.js";
import { runCommand } from "../utils/shell.js";
import { openRepoWithEditor } from "../utils/editors.js";

export function findRepoByName(name) {
  const repos = readRepos();
  return repos.find((repo) => repo.name === name);
}

function showRepoNotFound(name) {
  console.log(`Repositório não encontrado: ${name}`);
  console.log("Use o comando abaixo para ver os repositórios cadastrados:");
  console.log("gg repo list");
}

function ensureWorkspaceExists(repo) {
  const workspacePath = getWorkspacePath(repo.workspace);

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }
}

function cloneRepoIfNeeded(repo) {
  const repoPath = getRepoPath(repo);

  if (fs.existsSync(repoPath)) {
    return repoPath;
  }

  ensureWorkspaceExists(repo);

  console.log(`Clonando ${repo.name}...`);
  console.log(`Destino: ${repoPath}`);

  try {
    runCommand("git", ["clone", repo.url, repoPath]);

    console.log("");
    console.log("Repositório clonado com sucesso.");
  } catch {
    console.log("");
    console.log(`Não foi possível clonar o repositório: ${repo.name}`);
    console.log(`URL: ${repo.url}`);
    console.log("");
    console.log("Possíveis causas:");
    console.log("- o repositório não existe;");
    console.log("- a URL está errada no config/repos.json;");
    console.log("- o repositório é privado e o Git não está autenticado;");
    console.log("- você não tem permissão de acesso.");
    console.log("");
    console.log("Teste manualmente com:");
    console.log(`git clone ${repo.url}`);
    return null;
  }

  return repoPath;
}

function ensureRepoExistsLocally(repo) {
  const repoPath = getRepoPath(repo);

  if (!fs.existsSync(repoPath)) {
    console.log(`O repositório ainda não existe localmente: ${repo.name}`);
    console.log(`Caminho esperado: ${repoPath}`);
    console.log("");
    console.log("Clone primeiro com:");
    console.log(`gg repo clone ${repo.name}`);
    return null;
  }

  return repoPath;
}

function isValidGitUrl(url) {
  return (
    url.startsWith("https://github.com/") ||
    url.startsWith("git@github.com:")
  );
}

function normalizeRepoName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function listRepos() {
  const repos = readRepos();

  if (repos.length === 0) {
    console.log("Nenhum repositório cadastrado.");
    return;
  }

  console.log("");
  console.log("Repositórios cadastrados:");
  console.log("");

  for (const repo of repos) {
    console.log(`- ${repo.name}`);
    console.log(`  ${repo.description || "Sem descrição"}`);
    console.log(`  URL: ${repo.url}`);
    console.log(`  Tipo: ${repo.type || "não informado"}`);
    console.log(`  Workspace: ${repo.workspace || "default"}`);
    console.log(`  Editor padrão: ${repo.defaultEditor || "não informado"}`);
    console.log("");
  }
}

export async function addRepoInteractive() {
  const repos = readRepos();

  const name = await input({
    message: "Nome curto do repositório:",
    validate: (value) => {
      const normalized = normalizeRepoName(value);

      if (!normalized) {
        return "Informe um nome.";
      }

      if (repos.some((repo) => repo.name === normalized)) {
        return "Já existe um repositório com esse nome.";
      }

      return true;
    }
  });

  const normalizedName = normalizeRepoName(name);

  const description = await input({
    message: "Descrição:",
    default: ""
  });

  const url = await input({
    message: "URL do Git:",
    validate: (value) => {
      if (!isValidGitUrl(value.trim())) {
        return "Informe uma URL GitHub HTTPS ou SSH válida.";
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
      { name: "Script/Automação", value: "automation" },
      { name: "Outro", value: "other" }
    ]
  });

  const defaultEditor = await select({
    message: "Editor padrão:",
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
      { name: "Trabalho / padrão", value: "default" }
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
  console.log("Novo repositório:");
  console.log(JSON.stringify(newRepo, null, 2));
  console.log("");

  const shouldSave = await confirm({
    message: "Salvar este repositório?",
    default: true
  });

  if (!shouldSave) {
    console.log("Cadastro cancelado.");
    return;
  }

  repos.push(newRepo);
  saveRepos(repos);

  console.log("");
  console.log(`Repositório cadastrado: ${normalizedName}`);
}

export async function removeRepoInteractive(name) {
  const repos = readRepos();
  const selectedRepo = repos.find((repo) => repo.name === name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return;
  }

  console.log("");
  console.log("Repositório selecionado:");
  console.log(JSON.stringify(selectedRepo, null, 2));
  console.log("");

  const shouldRemove = await confirm({
    message: "Remover este repositório do cadastro?",
    default: false
  });

  if (!shouldRemove) {
    console.log("Remoção cancelada.");
    return;
  }

  const updatedRepos = repos.filter((repo) => repo.name !== name);
  saveRepos(updatedRepos);

  console.log(`Repositório removido do cadastro: ${name}`);
}

export function cloneRepoByName(name) {
  const selectedRepo = findRepoByName(name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return;
  }

  const repoPath = getRepoPath(selectedRepo);

  if (fs.existsSync(repoPath)) {
    console.log(`O repositório já existe em: ${repoPath}`);
    return;
  }

  cloneRepoIfNeeded(selectedRepo);
}

export function openRepoByName(name, editorOption = null) {
  const selectedRepo = findRepoByName(name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return;
  }

  const repoPath = cloneRepoIfNeeded(selectedRepo);

  if (!repoPath) {
    return;
  }

  console.log(`Abrindo ${selectedRepo.name}...`);
  openRepoWithEditor(selectedRepo, repoPath, editorOption);
}

export function statusRepoByName(name) {
  const selectedRepo = findRepoByName(name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return;
  }

  const repoPath = ensureRepoExistsLocally(selectedRepo);

  if (!repoPath) {
    return;
  }

  console.log("");
  console.log(`Status de ${selectedRepo.name}:`);
  console.log(`Pasta: ${repoPath}`);
  console.log("");

  runCommand("git", ["-C", repoPath, "status", "--short"]);
}

export function pullRepoByName(name) {
  const selectedRepo = findRepoByName(name);

  if (!selectedRepo) {
    showRepoNotFound(name);
    return;
  }

  const repoPath = ensureRepoExistsLocally(selectedRepo);

  if (!repoPath) {
    return;
  }

  console.log("");
  console.log(`Atualizando ${selectedRepo.name}...`);
  console.log(`Pasta: ${repoPath}`);
  console.log("");

  runCommand("git", ["-C", repoPath, "pull", "--ff-only"]);
}

export function statusAllRepos() {
  const repos = readRepos();

  if (repos.length === 0) {
    console.log("Nenhum repositório cadastrado.");
    return;
  }

  for (const item of repos) {
    statusRepoByName(item.name);
  }
}

export function pullAllRepos() {
  const repos = readRepos();

  if (repos.length === 0) {
    console.log("Nenhum repositório cadastrado.");
    return;
  }

  for (const item of repos) {
    pullRepoByName(item.name);
  }
}

export function registerRepoCommands(program) {
  const repo = program
    .command("repo")
    .description("Gerencia repositórios");

  repo
    .command("list")
    .description("Lista os repositórios cadastrados")
    .action(() => {
      listRepos();
    });

  repo
    .command("add")
    .description("Adiciona um novo repositório ao cadastro")
    .action(async () => {
      await addRepoInteractive();
    });

  repo
    .command("remove")
    .description("Remove um repositório do cadastro")
    .argument("<name>", "Nome do repositório cadastrado")
    .action(async (name) => {
      await removeRepoInteractive(name);
    });

  repo
    .command("clone")
    .description("Clona um repositório cadastrado")
    .argument("<name>", "Nome do repositório cadastrado")
    .action((name) => {
      cloneRepoByName(name);
    });

  repo
    .command("open")
    .description("Clona se necessário e abre um repositório")
    .argument("<name>", "Nome do repositório cadastrado")
    .option("--code", "Abre no VS Code")
    .option("--vscode", "Abre no VS Code")
    .option("--idea", "Abre no IntelliJ IDEA")
    .option("--intellij", "Abre no IntelliJ IDEA")
    .option("--explorer", "Abre no Explorer")
    .option("--terminal", "Abre no terminal")
    .action((name, options) => {
      let editorOption = null;

      if (options.code || options.vscode) {
        editorOption = "vscode";
      }

      if (options.idea || options.intellij) {
        editorOption = "intellij";
      }

      if (options.terminal) {
        editorOption = "terminal";
      }

      if (options.explorer) {
        editorOption = "explorer";
      }

      openRepoByName(name, editorOption);
    });

  repo
    .command("status")
    .description("Mostra o status Git de um repositório")
    .argument("<name>", "Nome do repositório cadastrado")
    .action((name) => {
      statusRepoByName(name);
    });

  repo
    .command("pull")
    .description("Atualiza um repositório com git pull --ff-only")
    .argument("<name>", "Nome do repositório cadastrado")
    .action((name) => {
      pullRepoByName(name);
    });

  repo
    .command("status-all")
    .description("Mostra o status Git de todos os repositórios clonados")
    .action(() => {
      statusAllRepos();
    });

  repo
    .command("pull-all")
    .description("Atualiza todos os repositórios clonados com git pull --ff-only")
    .action(() => {
      pullAllRepos();
    });
}