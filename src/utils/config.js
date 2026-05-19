import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE);
const PROJECT_ROOT = path.resolve(CURRENT_DIR, "../..");
const DATA_ROOT_ENV = "GG_DATA_ROOT";
const LOCAL_CONFIG_ENV = "GG_USE_LOCAL_CONFIG";

export function getProjectRoot() {
  return PROJECT_ROOT;
}

export function resolveProjectPath(relativePath) {
  return path.resolve(PROJECT_ROOT, relativePath);
}

export function getDataRoot() {
  const configuredRoot = process.env[DATA_ROOT_ENV]?.trim();
  return configuredRoot ? path.resolve(configuredRoot) : PROJECT_ROOT;
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
