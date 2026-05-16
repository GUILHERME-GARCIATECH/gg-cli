import { select, input } from "@inquirer/prompts";
import { readRepos } from "./utils/config.js";
import {
    listRepos,
    addRepoInteractive,
    removeRepoInteractive,
    cloneRepoByName,
    openRepoByName,
    statusRepoByName,
    pullRepoByName,
    statusAllRepos,
    pullAllRepos
} from "./commands/repo.js";

export async function openMainMenu() {
    let running = true;

    while (running) {
        const option = await select({
            message: "O que você quer fazer?",
            choices: [
                {
                    name: "Repositorios",
                    value: "repos"
                },
                {
                    name: "Faculdade",
                    value: "faculty"
                },
                {
                    name: "Manutenção do PC",
                    value: "pc"
                },
                {
                    name: "Configurações",
                    value: "settings"
                },
                {
                    name: "Sair",
                    value: "exit"
                }
            ]
        });

        if (option === "repos") {
            await openRepoMenu();
        }
        if (option === "faculty") {
            console.log("Modo faculdade ainda será implementado.");
        }

        if (option === "pc") {
            console.log("Menu de manutenção ainda será implementado.");
        }

        if (option === "settings") {
            console.log("Menu de configurações ainda será implementado.");
        }

        if (option === "exit") {
            running = false;
        }

    }
}


async function openRepoMenu() {
    let running = true;

    while (running) {
        const option = await select({
            message: "O que você quer fazer",
            choices: [
                { name: "Listar repositórios", value: "list" },
                { name: "Adicionar repositório", value: "add" },
                { name: "Remover repositório", value: "remove" },
                { name: "Clonar repositório", value: "clone" },
                { name: "Abrir repositório", value: "open" },
                { name: "Ver status de um repositório", value: "status" },
                { name: "Atualizar um repositório", value: "pull" },
                { name: "Ver status de todos", value: "status-all" },
                { name: "Atualizar todos", value: "pull-all" },
                { name: "Voltar", value: "back" }
            ]
        });

        if (option === "list") {
            listRepos();
            await pause();
        }
        if (option === "add") {
            await addRepoInteractive();
            await pause();
        }

        if (option === "remove") {
            const repoName = await selectRepoName();

            if (repoName) {
                await removeRepoInteractive(repoName);
            }

            await pause();
        }
        if (option === "clone") {
            const repoName = await selectRepoName();

            if (repoName) {
                cloneRepoByName(repoName);
            }

            await pause();
        }

        if (option === "open") {
            const repoName = await selectRepoName();

            if (repoName) {
                const editor = await select({
                    message: "Como deseja abrir?",
                    choices: [
                        { name: "Editor padrão do repositório", value: null },
                        { name: "VS Code", value: "vscode" },
                        { name: "IntelliJ IDEA", value: "intellij" },
                        { name: "Explorer", value: "explorer" },
                        { name: "Terminal", value: "terminal" }
                    ]
                });

                openRepoByName(repoName, editor);
            }

            await pause();
        }

        if (option === "status") {
            const repoName = await selectRepoName();

            if (repoName) {
                statusRepoByName(repoName);
            }

            await pause();
        }

        if (option === "pull") {
            const repoName = await selectRepoName();

            if (repoName) {
                pullRepoByName(repoName);
            }

            await pause();
        }

        if (option === "status-all") {
            statusAllRepos();
            await pause();
        }

        if (option === "pull-all") {
            pullAllRepos();
            await pause();
        }

        if (option === "back") {
            running = false;
        }
    }
}

async function selectRepoName() {
  const repos = readRepos();

  if (repos.length === 0) {
    console.log("Nenhum repositório cadastrado.");
    return null;
  }

  return await select({
    message: "Escolha um repositório:",
    choices: repos.map((repo) => ({
      name: `${repo.name} - ${repo.description || "Sem descrição"}`,
      value: repo.name
    }))
  });
}

async function pause() {
  await input({
    message: "Pressione Enter para continuar..."
  });
}