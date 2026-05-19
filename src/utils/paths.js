import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readSettings } from "./config.js";

export const DEFAULT_WORKSPACE_ROOT = "C:\\.gg";
export const DEFAULT_WORKSPACE = "C:\\.gg\\default";
export const DEFAULT_FACULTY_WORKSPACE = "C:\\.gg\\faculdade";

export function getWorkspacePath(workspaceName) {
  const settings = readSettings();

  if (workspaceName === "faculdade") {
    return settings.facultyWorkspace || DEFAULT_FACULTY_WORKSPACE;
  }

  return settings.defaultWorkspace || DEFAULT_WORKSPACE;
}

export function ensureHiddenDirectory(directoryPath) {
  const resolvedPath = path.resolve(directoryPath);

  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
  }

  if (process.platform === "win32") {
    spawnSync("attrib", ["+h", resolvedPath], {
      shell: false,
      stdio: "ignore"
    });
  }

  return resolvedPath;
}

export function ensureWorkspaceDirectory(workspaceName) {
  const workspacePath = getWorkspacePath(workspaceName);

  if (isSameOrInsidePath(DEFAULT_WORKSPACE_ROOT, workspacePath)) {
    ensureHiddenDirectory(DEFAULT_WORKSPACE_ROOT);
  }

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }

  return workspacePath;
}

export function getRepoPath(repo) {
  const workspacePath = getWorkspacePath(repo.workspace);
  return path.join(workspacePath, repo.name);
}

export function isInsidePath(parentPath, childPath) {
  const relativePath = path.relative(
    path.resolve(parentPath),
    path.resolve(childPath)
  );

  return Boolean(relativePath) &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath);
}

export function isSameOrInsidePath(parentPath, childPath) {
  return path.resolve(parentPath) === path.resolve(childPath) || isInsidePath(parentPath, childPath);
}
