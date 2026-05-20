import fs from "node:fs";
import path from "node:path";
import { isSea } from "node:sea";
import { fileURLToPath } from "node:url";

const DATA_ROOT_ENV = "GG_DATA_ROOT";
const LOCAL_CONFIG_ENV = "GG_USE_LOCAL_CONFIG";

function getCurrentFilePath() {
  if (isSea()) {
    return process.execPath;
  }

  if (typeof __filename === "string") {
    return __filename;
  }

  return fileURLToPath(import.meta.url);
}

function resolveProjectRoot() {
  const currentFile = getCurrentFilePath();
  const currentDir = path.dirname(currentFile);

  if (isSea()) {
    return path.resolve(currentDir, "..");
  }

  return path.resolve(currentDir, "../..");
}

function resolveInstalledDataRoot() {
  if (!isSea()) {
    return null;
  }

  const binDir = path.dirname(process.execPath);
  const appRoot = path.dirname(binDir);

  if (
    path.basename(binDir).toLowerCase() === "bin" &&
    path.basename(appRoot).toLowerCase() === "gg-cli"
  ) {
    return path.dirname(appRoot);
  }

  return null;
}

const PROJECT_ROOT = resolveProjectRoot();

export function getProjectRoot() {
  return PROJECT_ROOT;
}

export function resolveProjectPath(relativePath) {
  return path.resolve(PROJECT_ROOT, relativePath);
}

export function getDataRoot() {
  const configuredRoot = process.env[DATA_ROOT_ENV]?.trim();
  const installedRoot = resolveInstalledDataRoot();

  if (configuredRoot) {
    return path.resolve(configuredRoot);
  }

  return installedRoot || PROJECT_ROOT;
}

export function resolveDataPath(relativePath) {
  return path.resolve(getDataRoot(), relativePath);
}

export function shouldUseLocalConfig() {
  return process.env[LOCAL_CONFIG_ENV] === "1";
}

export function resolveConfigPath(fileName) {
  const publicPath = resolveDataPath(`config/${fileName}`);

  if (!shouldUseLocalConfig()) {
    return publicPath;
  }

  const parsedPath = path.parse(fileName);
  const localFileName = `${parsedPath.name}.local${parsedPath.ext}`;
  const localPath = resolveDataPath(`config/${localFileName}`);

  return fs.existsSync(localPath) ? localPath : publicPath;
}

function readJsonFromPath(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  const content = fs.readFileSync(filePath, "utf-8");

  if (!content.trim()) {
    return fallback;
  }

  return JSON.parse(content);
}

function writeJsonToPath(filePath, data) {
  const dirPath = path.dirname(filePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function readJsonFile(relativePath, fallback = null) {
  return readJsonFromPath(resolveProjectPath(relativePath), fallback);
}

export function writeJsonFile(relativePath, data) {
  writeJsonToPath(resolveProjectPath(relativePath), data);
}

export function readDataJsonFile(relativePath, fallback = null) {
  return readJsonFromPath(resolveDataPath(relativePath), fallback);
}

export function writeDataJsonFile(relativePath, data) {
  writeJsonToPath(resolveDataPath(relativePath), data);
}

export function readRepos() {
  return readJsonFromPath(resolveConfigPath("repos.json"), []);
}

export function saveRepos(repos) {
  writeJsonToPath(resolveConfigPath("repos.json"), repos);
}

export function readSettings() {
  return readJsonFromPath(resolveConfigPath("settings.json"), {});
}
