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