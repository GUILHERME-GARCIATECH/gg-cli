import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import { readSettings } from "../utils/config.js";
import { getRepoPath, getWorkspacePath, isInsidePath } from "../utils/paths.js";
import {
  getRepoLocalState,
  getReposByWorkspace,
  hasLocalChanges
} from "./repo.js";

function validateCleanWorkspace(workspacePath) {
  const resolved = path.resolve(workspacePath);
  const root = path.parse(resolved).root;

  if (resolved === root) {
    return {
      ok: false,
      message: "Recusei limpar a raiz do disco."
    };
  }

  if (resolved === path.resolve(os.homedir())) {
    return {
      ok: false,
      message: "Recusei limpar a pasta inicial do usuario."
    };
  }

  return {
    ok: true,
    path: resolved
  };
}

function getExistingFacultyRepoTargets(workspacePath) {
  const repos = getReposByWorkspace("faculdade");

  return repos
    .map((repo) => ({
      repo,
      repoPath: getRepoPath(repo)
    }))
    .filter((item) => fs.existsSync(item.repoPath))
    .filter((item) => isInsidePath(workspacePath, item.repoPath));
}

function inspectCleanTargets(targets) {
  const risks = [];

  for (const target of targets) {
    const state = getRepoLocalState(target.repo);

    if (!state.ok) {
      risks.push({
        repoName: target.repo.name,
        repoPath: target.repoPath,
        message: state.message
      });
      continue;
    }

    const changes = hasLocalChanges(state.repoPath);

    if (!changes.ok) {
      risks.push({
        repoName: target.repo.name,
        repoPath: target.repoPath,
        message: "Nao foi possivel verificar alteracoes locais.",
        output: changes.output
      });
      continue;
    }

    if (changes.dirty) {
      risks.push({
        repoName: target.repo.name,
        repoPath: target.repoPath,
        message: "Existem alteracoes locais nao commitadas.",
        output: changes.status
      });
    }
  }

  return risks;
}

function removeEmptyWorkspace(workspacePath) {
  if (!fs.existsSync(workspacePath)) {
    return;
  }

  const entries = fs.readdirSync(workspacePath);

  if (entries.length === 0) {
    fs.rmdirSync(workspacePath);
  }
}

export async function cleanFaculty() {
  const settings = readSettings();
  const workspacePath = getWorkspacePath("faculdade");
  const validation = validateCleanWorkspace(workspacePath);

  console.log("");
  console.log("Limpeza faculdade");
  console.log(`Workspace: ${workspacePath}`);

  if (!validation.ok) {
    console.log(validation.message);
    return {
      ok: false,
      message: validation.message
    };
  }

  if (!fs.existsSync(workspacePath)) {
    console.log("Workspace da faculdade nao existe. Nada para limpar.");
    return {
      ok: true,
      removed: []
    };
  }

  const targets = getExistingFacultyRepoTargets(workspacePath);

  if (targets.length === 0) {
    console.log("Nenhum repositorio cadastrado da faculdade foi encontrado dentro do workspace.");
    return {
      ok: true,
      removed: []
    };
  }

  console.log("");
  console.log("Repositorios que podem ser removidos:");

  for (const target of targets) {
    console.log(`- ${target.repo.name}: ${target.repoPath}`);
  }

  const risks = inspectCleanTargets(targets);

  if (risks.length > 0) {
    console.log("");
    console.log("Atencao: encontrei riscos antes da limpeza.");

    for (const risk of risks) {
      console.log(`- ${risk.repoName}: ${risk.message}`);
      console.log(`  ${risk.repoPath}`);

      if (risk.output) {
        console.log(risk.output);
      }
    }
  }

  const defaultAnswer = false;
  const message = risks.length > 0 && settings.safeClean !== false
    ? "Existem riscos/alteracoes locais. Apagar mesmo assim?"
    : "Remover estes repositorios do workspace da faculdade?";

  const shouldClean = await confirm({
    message,
    default: defaultAnswer
  });

  if (!shouldClean) {
    console.log("Limpeza cancelada.");
    return {
      ok: false,
      cancelled: true
    };
  }

  const removed = [];

  for (const target of targets) {
    fs.rmSync(target.repoPath, { recursive: true, force: true });
    removed.push(target.repoPath);
    console.log(`Removido: ${target.repoPath}`);
  }

  removeEmptyWorkspace(workspacePath);

  console.log("");
  console.log("Limpeza concluida.");

  return {
    ok: true,
    removed
  };
}

export function registerCleanCommands(program) {
  const clean = program
    .command("clean")
    .alias("cl")
    .description("Executa limpezas seguras de ambientes criados pela CLI");

  clean
    .command("faculdade")
    .alias("f")
    .description("Remove repositorios cadastrados da faculdade com confirmacao")
    .action(async () => {
      await cleanFaculty();
    });
}
