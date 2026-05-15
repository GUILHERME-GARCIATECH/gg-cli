import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();

export function readJsonFile(relativePath, fallback = null) {
    const filePath = path.join(ROOT_DIR, relativePath);

    if (!fs.existsSync(filePath)) {
        return fallback;
    }

    const content = fs.readFileSync(filePath, "utf-8");

    if (!content.trim()) {
        return fallback;
    }

    return JSON.parse(content);
}

export function readRepos() {
    return readJsonFile("config/repos.json", []);
}

export function readSettings() {
    return readJsonFile("config/settings.json,", {});
}

