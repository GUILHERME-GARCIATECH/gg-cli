import { select } from "@inquirer/prompts";

export async function openMainMenu() {
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
                name: "Java / OBI",
                value: "java"
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

    console.log("Opção selecionada: ", option)
}