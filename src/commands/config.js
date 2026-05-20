import fs from "node:fs";
import path from "node:path";
import { getDataRoot, readDataJsonFile, resolveDataPath, writeDataJsonFile } from "../utils/config.js";
import { runCommandResult } from "../utils/shell.js";

const CONFIG_SOURCE_PATH = "config/config-source.json";
const CONFIG_BACKUP_DIR = "config/backups";
const CONFIG_CACHE_DIR = "cache/config-repo";
const REPOS_FILE = "repos.json";
const SETTINGS_FILE = "settings.json";
const PRIVATE_REPOS_FILE = "repos.local.json";
const PRIVATE_SETTINGS_FILE = "settings.local.json";

const WILDCARD_REPOS = [
  {
    name: "git",
    description: "Repositorio oficial do Git",
    url: "https://github.com/git/git.git",
    type: "other",
    defaultEditor: "vscode",
    workspace: "default"
  },
  {
    name: "hello-world",
    description: "Repositorio publico de exemplo do Octocat",
    url: "https://github.com/octocat/Hello-World.git",
    type: "study",
    defaultEditor: "vscode",
    workspace: "default"
  },
  {
    name: "vscode",
    description: "Editor Visual Studio Code",
    url: "https://github.com/microsoft/vscode.git",
    type: "node",
    defaultEditor: "vscode",
    workspace: "default"
  }
];

const WILDCARD_SETTINGS = {
  defaultWorkspace: "C:\\.gg\\default",
  facultyWorkspace: "C:\\.gg\\faculdade",
  defaultGitUser: {
    name: "",
    email: ""
  },
  editors: {
    vscode: "code",
    intellij: "idea"
  },
  safeClean: true
};

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);

    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function valuesEqual(left, right) {
  return stableStringify(left) === stableStringify(right);
}

function createTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

function readJsonFromPath(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

function writeJsonToPath(filePath, data) {
  const dirPath = path.dirname(filePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function directoryExists(directoryPath) {
  return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
}

function isGitUrl(source) {
  return /^(https?:\/\/|ssh:\/\/|git@)/i.test(source);
}

function isGitWorkTree(directoryPath) {
  const result = runCommandResult("git", ["-C", directoryPath, "rev-parse", "--is-inside-work-tree"]);
  return result.ok && result.stdout === "true";
}

function getOriginUrl(directoryPath) {
  const result = runCommandResult("git", ["-C", directoryPath, "remote", "get-url", "origin"]);
  return result.ok ? result.stdout : "";
}

function explainGitFailure(action, result) {
  const details = result.output || result.error?.message || "erro desconhecido";

  return [
    `Nao foi possivel ${action}.`,
    details,
    "Confira se o Git esta instalado, se user.name/user.email estao configurados e se voce esta autenticado no GitHub/Git Credential Manager ou com SSH configurado."
  ].join("\n");
}

function runGitOrThrow(directoryPath, args, action) {
  const result = runCommandResult("git", ["-C", directoryPath, ...args]);

  if (!result.ok) {
    throw new Error(explainGitFailure(action, result));
  }

  return result;
}

function ensureCacheForGitSource(source) {
  const cachePath = resolveDataPath(CONFIG_CACHE_DIR);
  const cacheParent = path.dirname(cachePath);

  if (!fs.existsSync(cacheParent)) {
    fs.mkdirSync(cacheParent, { recursive: true });
  }

  if (directoryExists(cachePath) && (!isGitWorkTree(cachePath) || getOriginUrl(cachePath) !== source)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
  }

  if (!directoryExists(cachePath)) {
    const result = runCommandResult("git", ["clone", source, cachePath]);

    if (!result.ok) {
      throw new Error(explainGitFailure("clonar o repo privado de configuracao", result));
    }

    return cachePath;
  }

  runGitOrThrow(cachePath, ["pull", "--ff-only"], "atualizar o repo privado de configuracao");
  return cachePath;
}

function loadSourceState() {
  return readDataJsonFile(CONFIG_SOURCE_PATH, null);
}

function saveSourceState(sourceInfo, action) {
  const now = new Date().toISOString();
  const previous = loadSourceState() || {};
  const state = {
    ...previous,
    source: sourceInfo.source,
    type: sourceInfo.type,
    repoPath: sourceInfo.repoPath || previous.repoPath || null,
    lastImport: action === "import" ? now : previous.lastImport || null,
    lastPush: action === "push" ? now : previous.lastPush || null
  };

  writeDataJsonFile(CONFIG_SOURCE_PATH, state);
  return state;
}

function normalizeSource(source) {
  const value = source?.trim();

  if (!value) {
    return null;
  }

  if (isGitUrl(value)) {
    return {
      source: value,
      type: "git"
    };
  }

  return {
    source: path.resolve(value),
    type: "path"
  };
}

function resolveSource(source) {
  const explicitSource = normalizeSource(source);

  if (explicitSource) {
    return explicitSource;
  }

  const savedSource = loadSourceState();

  if (!savedSource?.source) {
    throw new Error("Nenhum repo de configuracao informado. Use: gg config import <repo-url-ou-pasta>");
  }

  return {
    source: savedSource.source,
    type: savedSource.type || (isGitUrl(savedSource.source) ? "git" : "path")
  };
}

function resolveSourcePath(sourceInfo) {
  if (sourceInfo.type === "git") {
    return ensureCacheForGitSource(sourceInfo.source);
  }

  if (!directoryExists(sourceInfo.source)) {
    throw new Error(`Pasta de configuracao nao encontrada: ${sourceInfo.source}`);
  }

  return sourceInfo.source;
}

export function getWildcardConfig() {
  return {
    repos: WILDCARD_REPOS,
    settings: WILDCARD_SETTINGS
  };
}

export function isWildcardConfig(repos, settings) {
  return valuesEqual(repos, WILDCARD_REPOS) && valuesEqual(settings, WILDCARD_SETTINGS);
}

export function findConfigFiles(sourcePath) {
  const reposPath = [
    path.join(sourcePath, PRIVATE_REPOS_FILE),
    path.join(sourcePath, REPOS_FILE)
  ].find(fileExists);
  const settingsPath = [
    path.join(sourcePath, PRIVATE_SETTINGS_FILE),
    path.join(sourcePath, SETTINGS_FILE)
  ].find(fileExists);

  if (!reposPath || !settingsPath) {
    throw new Error(
      `Repo de configuracao incompleto. Esperado ${PRIVATE_REPOS_FILE}/${PRIVATE_SETTINGS_FILE} ou ${REPOS_FILE}/${SETTINGS_FILE}.`
    );
  }

  return {
    reposPath,
    settingsPath
  };
}

export function readConfigFromSource(sourcePath) {
  const { reposPath, settingsPath } = findConfigFiles(sourcePath);
  const repos = readJsonFromPath(reposPath);
  const settings = readJsonFromPath(settingsPath);

  validateImportedConfig(repos, settings);

  return {
    repos,
    settings,
    reposPath,
    settingsPath
  };
}

export function validateImportedConfig(repos, settings) {
  if (!Array.isArray(repos)) {
    throw new Error("repos.json/repos.local.json precisa conter uma lista JSON.");
  }

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error("settings.json/settings.local.json precisa conter um objeto JSON.");
  }
}

function getCurrentConfig() {
  return {
    repos: readDataJsonFile(`config/${REPOS_FILE}`, null),
    settings: readDataJsonFile(`config/${SETTINGS_FILE}`, null),
    reposPath: resolveDataPath(`config/${REPOS_FILE}`),
    settingsPath: resolveDataPath(`config/${SETTINGS_FILE}`)
  };
}

export function shouldBackupCurrentConfig(currentConfig = getCurrentConfig()) {
  const hasRepos = currentConfig.repos !== null;
  const hasSettings = currentConfig.settings !== null;

  if (!hasRepos && !hasSettings) {
    return false;
  }

  if (hasRepos && hasSettings && isWildcardConfig(currentConfig.repos, currentConfig.settings)) {
    return false;
  }

  return true;
}

export function backupCurrentConfig(timestamp = createTimestamp()) {
  const currentConfig = getCurrentConfig();

  if (!shouldBackupCurrentConfig(currentConfig)) {
    return {
      created: false,
      files: []
    };
  }

  const backupDir = resolveDataPath(CONFIG_BACKUP_DIR);
  const files = [];

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  if (fileExists(currentConfig.reposPath)) {
    const backupPath = path.join(backupDir, `${timestamp}-${REPOS_FILE}`);
    fs.copyFileSync(currentConfig.reposPath, backupPath);
    files.push(backupPath);
  }

  if (fileExists(currentConfig.settingsPath)) {
    const backupPath = path.join(backupDir, `${timestamp}-${SETTINGS_FILE}`);
    fs.copyFileSync(currentConfig.settingsPath, backupPath);
    files.push(backupPath);
  }

  return {
    created: files.length > 0,
    files
  };
}

export function importConfig(source = null) {
  const sourceInfo = resolveSource(source);
  const sourcePath = resolveSourcePath(sourceInfo);
  const importedConfig = readConfigFromSource(sourcePath);
  const backup = backupCurrentConfig();

  writeDataJsonFile(`config/${REPOS_FILE}`, importedConfig.repos);
  writeDataJsonFile(`config/${SETTINGS_FILE}`, importedConfig.settings);

  const state = saveSourceState({ ...sourceInfo, repoPath: sourcePath }, "import");

  return {
    ok: true,
    sourceInfo,
    sourcePath,
    importedConfig,
    backup,
    state
  };
}

function copyCurrentConfigToSource(sourcePath) {
  const currentConfig = getCurrentConfig();
  validateImportedConfig(currentConfig.repos, currentConfig.settings);

  const reposPath = path.join(sourcePath, PRIVATE_REPOS_FILE);
  const settingsPath = path.join(sourcePath, PRIVATE_SETTINGS_FILE);

  writeJsonToPath(reposPath, currentConfig.repos);
  writeJsonToPath(settingsPath, currentConfig.settings);

  return {
    reposPath,
    settingsPath
  };
}

function getConfigFileStatus(sourcePath) {
  const result = runGitOrThrow(
    sourcePath,
    ["status", "--short", "--", PRIVATE_REPOS_FILE, PRIVATE_SETTINGS_FILE],
    "verificar alteracoes no repo privado de configuracao"
  );

  return result.stdout;
}

export function pushConfig(source = null) {
  const sourceInfo = resolveSource(source);
  const sourcePath = resolveSourcePath(sourceInfo);

  if (!isGitWorkTree(sourcePath)) {
    throw new Error(`A origem de configuracao precisa ser um repositorio Git: ${sourcePath}`);
  }

  if (sourceInfo.type === "git") {
    runGitOrThrow(sourcePath, ["pull", "--ff-only"], "atualizar o repo privado de configuracao");
  }

  const copiedFiles = copyCurrentConfigToSource(sourcePath);
  const status = getConfigFileStatus(sourcePath);

  if (!status) {
    const state = saveSourceState({ ...sourceInfo, repoPath: sourcePath }, "push");

    return {
      ok: true,
      changed: false,
      sourceInfo,
      sourcePath,
      copiedFiles,
      state
    };
  }

  runGitOrThrow(sourcePath, ["add", PRIVATE_REPOS_FILE, PRIVATE_SETTINGS_FILE], "preparar configs para commit");
  runGitOrThrow(sourcePath, ["commit", "-m", `Update GG CLI config ${createTimestamp()}`], "criar commit de configuracao");
  runGitOrThrow(sourcePath, ["push", "-u", "origin", "HEAD"], "subir configuracao para o repo privado");

  const state = saveSourceState({ ...sourceInfo, repoPath: sourcePath }, "push");

  return {
    ok: true,
    changed: true,
    sourceInfo,
    sourcePath,
    copiedFiles,
    status,
    state
  };
}

export function listConfig() {
  const currentConfig = getCurrentConfig();
  const savedSource = loadSourceState();
  const repos = currentConfig.repos || [];
  const settings = currentConfig.settings || {};
  const isWildcard = currentConfig.repos && currentConfig.settings
    ? isWildcardConfig(currentConfig.repos, currentConfig.settings)
    : false;

  console.log("");
  console.log("Configuracoes");
  console.log(`Data root: ${getDataRoot()}`);
  console.log(`repos.json: ${currentConfig.reposPath}`);
  console.log(`settings.json: ${currentConfig.settingsPath}`);
  console.log(`Origem lembrada: ${savedSource?.source || "nao configurada"}`);
  console.log(`Tipo: ${isWildcard ? "config coringa" : "config pessoal"}`);
  console.log("");
  console.log(`Repositorios cadastrados: ${repos.length}`);

  for (const repo of repos) {
    console.log(`- ${repo.name || "(sem nome)"}${repo.workspace ? ` [${repo.workspace}]` : ""}`);
  }

  console.log("");
  console.log("settings.json:");
  console.log(JSON.stringify(settings, null, 2));

  return {
    dataRoot: getDataRoot(),
    reposPath: currentConfig.reposPath,
    settingsPath: currentConfig.settingsPath,
    savedSource,
    isWildcard,
    repos,
    settings
  };
}

function printImportResult(result) {
  console.log("");
  console.log("Configuracao importada com sucesso.");
  console.log(`Origem: ${result.sourceInfo.source}`);
  console.log(`Repositorios: ${result.importedConfig.repos.length}`);
  console.log(`settings.json: ${resolveDataPath(`config/${SETTINGS_FILE}`)}`);
  console.log(`repos.json: ${resolveDataPath(`config/${REPOS_FILE}`)}`);

  if (result.backup.created) {
    console.log("");
    console.log("Backup criado:");

    for (const filePath of result.backup.files) {
      console.log(`- ${filePath}`);
    }
  } else {
    console.log("Backup: nao necessario, config atual era coringa ou inexistente.");
  }
}

function printPushResult(result) {
  console.log("");
  console.log("Configuracao preparada no repo privado.");
  console.log(`Origem: ${result.sourceInfo.source}`);
  console.log(`Repo local: ${result.sourcePath}`);

  if (!result.changed) {
    console.log("Nada para subir: repos.local.json e settings.local.json ja estavam atualizados.");
    return;
  }

  console.log("Commit e push concluidos.");
}

export async function runConfigImport(source = null) {
  const result = importConfig(source);
  printImportResult(result);
  return result;
}

export async function runConfigPush(source = null) {
  const result = pushConfig(source);
  printPushResult(result);
  return result;
}

export function getSavedConfigSource() {
  return loadSourceState();
}

export function registerConfigCommands(program) {
  const config = program
    .command("config")
    .alias("c")
    .description("Gerencia configuracoes pessoais da GG CLI");

  config
    .command("list")
    .alias("l")
    .description("Mostra configuracoes ativas")
    .action(() => {
      listConfig();
    });

  config
    .command("import")
    .alias("i")
    .description("Importa configuracoes de um repo privado ou pasta local")
    .argument("[source]", "URL Git ou pasta local do repo de configuracao")
    .action(async (source) => {
      await runConfigImport(source);
    });

  config
    .command("push")
    .alias("p")
    .description("Sobe as configuracoes atuais para o repo privado")
    .argument("[source]", "URL Git ou pasta local do repo de configuracao")
    .action(async (source) => {
      await runConfigPush(source);
    });
}
