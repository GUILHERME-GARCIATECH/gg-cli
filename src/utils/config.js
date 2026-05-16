import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE);
const PROJECT_ROOT = path.resolve(CURRENT_DIR, "../..");

export function getProjectRoot() {
  return PROJECT_ROOT;
}

export function resolveProjectPath(relativePath) {
  return path.resolve(PROJECT_ROOT, relativePath);
}

export function readJsonFile(relativePath, fallback = null) {
  const filePath = resolveProjectPath(relativePath);

  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  const content = fs.readFileSync(filePath, "utf-8");

  if (!content.trim()) {
    return fallback;
  }

  return JSON.parse(content);
}

export function writeJsonFile(relativePath, data) {
  const filePath = resolveProjectPath(relativePath);
  const dirPath = path.dirname(filePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function readRepos() {
  return readJsonFile("config/repos.json", []);
}

export function saveRepos(repos) {
  writeJsonFile("config/repos.json", repos);
}

export function readSettings() {
  return readJsonFile("config/settings.json", {});
}
