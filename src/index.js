#!/usr/bin/env node

import { Command } from "commander";
import { openMainMenu } from "./menu.js";
import { registerRepoCommands } from "./commands/repo.js";
import { registerSetupCommands } from "./commands/setup.js";
import { registerCleanCommands } from "./commands/clean.js";
import { registerGitCommands } from "./commands/git.js";
import { registerPcCommands } from "./commands/pc.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { translateAliases } from "./utils/aliases.js";

const program = new Command();

program
    .name("gg")
    .description("CLI pessoal")
    .version("0.1.0");

program
    .command("hello")
    .alias("hi")
    .description("Teste se a CLI esta funcionando")
    .action(() => {
        console.log("GG CLI Funcionando");
    })

program
    .command("menu")
    .alias("m")
    .description("Abre o menu interativo")
    .action(async () => {
        await openMainMenu();
    });

registerRepoCommands(program);
registerSetupCommands(program);
registerCleanCommands(program);
registerGitCommands(program);
registerPcCommands(program);
registerDoctorCommand(program);

if (process.argv.length <= 2) {
    await openMainMenu();
} else {
    program.parse(translateAliases(process.argv));
}
