import { readRepos } from "../utils/config.js";

export function registerRepoCommands(program) {
    const repo = program
        .command("repo")
        .description("Gerencia repositórios");

    repo
        .command("list")
        .description("Lista os repositorios cadastrados")
        .action(() => {
            const repos = readRepos();

            if (repos.length === 0) {
                console.log("Nenhum repositorio cadastrado.");
                return;
            }

            console.log("\nRepositórios cadastrados:\n");

            for (const repo of repos) {
                console.log(`- ${repo.name}`);
                console.log(`  ${repo.description || "Sem descrição"}`);
                console.log(`  URL: ${repo.url}`);
                console.log(`  Tipo: ${repo.type || "não informado"}`);
                console.log(`  Editor padrão: ${repo.defaultEditor || "não informado"}`);
                console.log("");
            }
        })
}