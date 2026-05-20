import open from "open";
import { readJsonFile, readSettings } from "../utils/config.js";
import { supportsHyperlinks } from "./terminal.js";

const DEFAULT_LINKS = {
  github: "https://github.com/GUILHERME-GARCIATECH",
  linkedin: "",
  project: "https://github.com/GUILHERME-GARCIATECH/gg-cli#readme"
};

const LINK_LABELS = {
  github: "GitHub",
  linkedin: "LinkedIn",
  project: "Projeto"
};

function normalizeRepositoryUrl(repository) {
  const value = typeof repository === "string" ? repository : repository?.url;

  if (!value) {
    return "";
  }

  return value
    .replace(/^git\+/, "")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");
}

function getProjectUrl(packageInfo) {
  return packageInfo?.homepage || normalizeRepositoryUrl(packageInfo?.repository) || DEFAULT_LINKS.project;
}

function normalizeUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) ? url : "";
}

export function resolveLinks({
  settings = readSettings(),
  packageInfo = readJsonFile("package.json", {})
} = {}) {
  const configuredLinks = settings?.ui?.links || {};
  const links = {
    github: configuredLinks.github ?? DEFAULT_LINKS.github,
    linkedin: configuredLinks.linkedin ?? DEFAULT_LINKS.linkedin,
    project: configuredLinks.project ?? getProjectUrl(packageInfo)
  };

  return Object.entries(links).map(([key, url]) => ({
    key,
    label: LINK_LABELS[key] || key,
    url: normalizeUrl(url),
    configured: Boolean(normalizeUrl(url))
  }));
}

export function getConfiguredLinks(options = {}) {
  return resolveLinks(options).filter((link) => link.configured);
}

export function formatHyperlink(label, url, options = {}) {
  if (!url || !supportsHyperlinks(options)) {
    return label;
  }

  return `\x1B]8;;${url}\x07${label}\x1B]8;;\x07`;
}

export function formatHeaderLinks(links = getConfiguredLinks(), options = {}) {
  return links
    .filter((link) => link.configured !== false && link.url)
    .map((link) => formatHyperlink(link.label, link.url, options))
    .join("   ");
}

export async function openExternalUrl(url, opener = open) {
  return await opener(url, {
    wait: false
  });
}
