#!/usr/bin/env node

import { Command } from "commander";
import { openMainMenu } from "./menu.js";
import { registerRepoCommands } from "./commands/repo.js";

const program = new Command();

program
    .name("gg")
    .description("CLI pessoal")
    .version("0.1.0");

program
    .command("hello")
    .description("Teste se a CLI esta funcionando")
    .action(() => {
        console.log("GG CLI Funcionando");
    })

program
    .command("menu")
    .description("Abre o menu interativo")
    .action(async () => {
        await openMainMenu();
    });

registerRepoCommands(program);

if (process.argv.length <= 2) {
    await openMainMenu();
} else {
    program.parse();
}
