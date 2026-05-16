import path from "node:path";
import { readSettings } from "./config.js";

export function getWorkspacePath(workspaceName) {
  const settings = readSettings();

  if (workspaceName === "faculdade") {
    return settings.facultyWorkspace || "C:\\gg-faculdade";
  }

  return settings.defaultWorkspace || "C:\\gg-workspace";
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
