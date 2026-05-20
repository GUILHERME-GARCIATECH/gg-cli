<p align="center">
  <img src="icon.png" alt="GG Banner" width="100%">
</p>

<h1 align="center">CLI pessoal para automatizar tarefas do dia a dia</h1>

Gerenciamento de repositórios, abertura rápida de projetos, setup de ambiente, limpeza segura e diagnósticos simples do PC.

O foco e uso pessoal em Windows, principalmente para maquinas temporarias. A ferramenta prioriza comandos rapidos, menu interativo limpo e seguranca antes de qualquer acao destrutiva.  

---

## Visao Geral

Principais capacidades atuais:

- gerenciar repositorios cadastrados em JSON;
- clonar, abrir, atualizar e consultar status Git;
- abrir projetos no VS Code, IntelliJ IDEA, Explorer ou terminal;
- preparar workspace temporario da faculdade;
- limpar repositorios da faculdade com confirmacao e checagem de alteracoes locais;
- diagnosticar Git, Node, editores, workspaces, rede e PC;
- usar comandos completos ou aliases curtos.

Exemplos:

```bash
gg
gg repo list
gg repo open hello-world --code
gg ro hello-world -c
gg -ro hello-world --c
gg setup faculdade
gg clean faculdade
gg doctor
```

---

## Instalacao E Desenvolvimento

### Instalacao Publica

Em maquinas Windows, o caminho recomendado e baixar e executar o instalador publicado no GitHub Releases:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Join-Path $env:TEMP 'install-gg.ps1'; Invoke-WebRequest 'https://raw.githubusercontent.com/GUILHERME-GARCIATECH/gg-cli/main/scripts/install-gg.ps1' -OutFile $p; & $p"
```

Se a maquina ja tiver Node.js/npm, tambem da para usar:

```powershell
npm exec --yes --package github:GUILHERME-GARCIATECH/gg-cli gg-install
```

### Instalador Windows

O instalador Inno Setup fica em:

```bash
installer\gg-cli.iss
```

Ele instala a CLI em `C:\ProgramData\GG\gg-cli`, cria `config`, `cache` e `logs` em `C:\ProgramData\GG`, cria os workspaces em `C:\.gg` e adiciona `C:\ProgramData\GG\gg-cli\bin` ao PATH do sistema.

O instalador publico e self-contained: ele empacota `dist\gg.exe`, nao exige Node.js/npm na maquina alvo e nao exige Inno Setup fora do ambiente de build.

O executavel e gerado com Node.js SEA a partir de um bundle unico criado pelo `esbuild`. O projeto nao usa mais `pkg`; Node 18 tambem nao e mais suportado para desenvolvimento/build porque as dependencias atuais exigem runtimes mais novos.

Para compilar apenas o executavel:

```bash
npm run build:exe
```

Esse comando gera e valida `dist\gg.exe`.

Para compilar, use o Inno Setup Compiler:

```bash
npm run build:installer
```

Para compilar e abrir o instalador a partir do checkout local:

```bash
npm run install:windows
```

Isso usa `scripts\build-installer.ps1`, procura `ISCC.exe` no PATH ou nos caminhos padrao do Inno Setup 6 e gera `dist\installer\gg-cli-setup.exe`.

Releases oficiais sao geradas por GitHub Actions quando uma tag `v*` e enviada para o repositorio.

### Desenvolvimento

Requisito de desenvolvimento/build: Node.js 24 ou superior.

Instalar dependencias:

```bash
npm install
```

Rodar localmente:

```bash
npm start
```

Rodar a CLI diretamente:

```bash
node src/index.js repo list
```

Instalar como comando local durante o desenvolvimento:

```bash
npm link
```

Depois disso, o comando `gg` fica disponivel no terminal.

Rodar testes:

```bash
npm.cmd test
```

Em alguns Windows, `npm test` pode ser bloqueado pela policy do PowerShell; `npm.cmd test` evita esse problema.

---

## Configuracao

A CLI le configuracoes a partir do data root. Em desenvolvimento, o data root e a propria raiz do projeto. Na instalacao Windows, o wrapper `gg.cmd` define `GG_DATA_ROOT=C:\ProgramData\GG`, entao os JSONs ficam em `C:\ProgramData\GG\config`.

As configs publicas deste repositorio sao exemplos. Configs pessoais devem ficar fora do repo publico, por exemplo em um repositorio privado com `repos.local.json` e `settings.local.json`.

Se configs pessoais ja tiverem sido commitadas antes de abrir o repositorio, crie um repo publico novo a partir do estado sanitizado ou limpe o historico com uma ferramenta propria para isso antes de publicar.

Para usar configs locais durante desenvolvimento, crie `config/repos.local.json` e `config/settings.local.json` e rode:

```powershell
$env:GG_USE_LOCAL_CONFIG="1"
npm start
```

Esses arquivos locais sao ignorados pelo Git e nao entram no instalador.

### Repo privado de configuracao

O jeito recomendado para usar a GG CLI em maquinas diferentes e criar um repo privado, por exemplo `gg-cli-config`, com estes arquivos na raiz:

```text
repos.local.json
settings.local.json
```

Depois importe uma vez:

```powershell
gg config import https://github.com/SEU-USUARIO/gg-cli-config.git
```

Ou via SSH:

```powershell
gg config import git@github.com:SEU-USUARIO/gg-cli-config.git
```

Depois do primeiro import, o GG lembra essa origem. Nas proximas maquinas ou atualizacoes, basta:

```powershell
gg config import
```

Para subir suas configs atuais para o repo privado:

```powershell
gg config push
```

Esse comando copia `config/repos.json` para `repos.local.json`, copia `config/settings.json` para `settings.local.json`, cria commit se houver mudancas e executa `git push`.

Antes de importar por cima de uma config pessoal, a CLI cria backup em `config/backups`. Se a config atual ainda for a config coringa publica, nenhum backup e criado. A CLI usa a autenticacao normal do Git; para repos privados, deixe GitHub/Git Credential Manager ou SSH configurado antes de rodar import/push. Para `gg config push`, o Git tambem precisa ter `user.name` e `user.email` configurados.

### `config/repos.json`

Lista de repositorios cadastrados:

```json
[
  {
    "name": "hello-world",
    "description": "Repositorio publico de exemplo do Octocat",
    "url": "https://github.com/octocat/Hello-World.git",
    "type": "study",
    "defaultEditor": "vscode",
    "workspace": "default"
  }
]
```

Campos usados:

| Campo | Funcao |
|---|---|
| `name` | Nome curto usado nos comandos. |
| `description` | Texto exibido em listas e menus. |
| `url` | URL GitHub HTTPS ou SSH. |
| `type` | Categoria livre: `node`, `java`, `study`, `automation`, `other`. |
| `defaultEditor` | Editor padrao: `vscode`, `intellij`, `explorer` ou `terminal`. |
| `workspace` | Workspace do repo: `default` ou `faculdade`. |

### `config/settings.json`

Configuracoes gerais:

```json
{
  "defaultWorkspace": "C:\\.gg\\default",
  "facultyWorkspace": "C:\\.gg\\faculdade",
  "defaultGitUser": {
    "name": "",
    "email": ""
  },
  "editors": {
    "vscode": "code",
    "intellij": "idea"
  },
  "safeClean": true,
  "ui": {
    "links": {
      "github": "https://github.com/GUILHERME-GARCIATECH",
      "linkedin": "",
      "project": "https://github.com/GUILHERME-GARCIATECH/gg-cli#readme"
    }
  }
}
```

Campos usados:

| Campo | Funcao |
|---|---|
| `defaultWorkspace` | Pasta base para repositorios comuns. Padrao: `C:\.gg\default`. |
| `facultyWorkspace` | Pasta temporaria usada pelo modo faculdade. Padrao: `C:\.gg\faculdade`. |
| `defaultGitUser` | Nome e email aplicados com `gg git config-local` e `gg setup faculdade`. |
| `editors.vscode` | Comando ou caminho do VS Code. |
| `editors.intellij` | Comando ou caminho do IntelliJ IDEA. |
| `safeClean` | Mantem limpeza conservadora, com confirmacao explicita. |
| `ui.links.github` | Link do GitHub pessoal mostrado no cabecalho e no menu Links. |
| `ui.links.linkedin` | Link do LinkedIn. Se ficar vazio, nao aparece. |
| `ui.links.project` | Link do README ou repositorio do projeto. |

---

## Menu Interativo

Rodar sem argumentos abre o menu:

```bash
gg
```

Tambem pode usar:

```bash
gg menu
gg m
```

O menu e auto-limpante e usa uma camada visual propria:

- a tela inicial mostra um `GG` grande feito com `figlet`, em azul, com subtitulo `Personal Developer CLI`;
- o banner usa `boxen` para borda alinhada e centralizada;
- o menu usa `@inquirer/prompts`, com item selecionado em azul/ciano;
- a CLI limpa a tela apenas na troca de telas, evitando redesenho completo a cada seta do menu;
- depois de `Pressione Enter para continuar...`, a tela e limpa e volta ao menu anterior.
- `Esc` encerra a CLI de forma segura;
- `Backspace` em submenus volta ao menu anterior;
- emojis aparecem no Windows Terminal/PowerShell quando o terminal parece suportar bem;
- no CMD, a CLI usa fallback sem emoji, sem hyperlink clicavel e com borda ASCII.

O cabecalho mostra links para GitHub, LinkedIn e Projeto. Em terminais que suportam hyperlinks OSC 8, os labels podem ser clicaveis; nos demais, use a opcao `Links` do menu principal para abrir no navegador.

Para trocar os links, edite `config/settings.json` ou, em desenvolvimento privado, `config/settings.local.json`:

```json
{
  "ui": {
    "links": {
      "github": "https://github.com/SEU-USUARIO",
      "linkedin": "https://www.linkedin.com/in/SEU-USUARIO",
      "project": "https://github.com/SEU-USUARIO/gg-cli#readme"
    }
  }
}
```

Para depurar sem limpar a tela:

```bash
$env:GG_NO_CLEAR="1"
gg
```

Para forcar fallback sem emojis:

```bash
$env:GG_NO_EMOJI="1"
gg
```

Para simular o fallback visual do CMD durante desenvolvimento:

```bash
$env:GG_FORCE_CMD_FALLBACK="1"
gg
```

Dependencias de UI usadas:

- `figlet` para o logo `GG`;
- `gradient-string` e `chalk` para cores;
- `boxen` para bordas;
- `string-width` e `wrap-ansi` para largura/alinhamento;
- `open` para abrir links no navegador.

---

## Referencia De Comandos

### Comandos Gerais

| Comando | Alias | Funcao |
|---|---|---|
| `gg` | - | Abre o menu interativo. |
| `gg menu` | `gg m` | Abre o menu interativo. |
| `gg hello` | `gg hi` | Teste simples da CLI. |
| `gg doctor` | `gg d` | Diagnostico geral da CLI, Git, Node, workspaces, editores e repos. |

### Repositorios

| Comando completo | Alias Commander | Alias compacto | Funcao |
|---|---|---|---|
| `gg repo list` | `gg r l` | `gg rl`, `gg -rl` | Lista repositorios cadastrados. |
| `gg repo add` | `gg r a` | `gg ra`, `gg -ra` | Adiciona repositorio pelo modo interativo. |
| `gg repo remove <repo>` | `gg r rm <repo>` | `gg rr <repo>`, `gg -rr <repo>` | Remove repositorio do cadastro. |
| `gg repo clone <repo>` | `gg r c <repo>` | `gg rc <repo>`, `gg -rc <repo>` | Clona repositorio cadastrado. |
| `gg repo open <repo>` | `gg r o <repo>` | `gg ro <repo>`, `gg -ro <repo>` | Clona se necessario e abre o repo. |
| `gg repo status <repo>` | `gg r st <repo>` | `gg rs <repo>`, `gg -rs <repo>` | Mostra `git status --short`. |
| `gg repo pull <repo>` | `gg r p <repo>` | `gg rp <repo>`, `gg -rp <repo>` | Executa `git pull --ff-only` com checagens. |
| `gg repo status-all` | `gg r sa` | `gg rsa`, `gg -rsa` | Mostra status de todos, sem parar na primeira falha. |
| `gg repo pull-all` | `gg r pa` | `gg rpa`, `gg -rpa` | Atualiza todos, sem parar na primeira falha. |
| `gg repo doctor` | `gg r d` | `gg rd`, `gg -rd` | Valida cadastro, pastas locais e estado Git dos repos. |

Opcoes de `repo open`:

| Editor | Opcoes |
|---|---|
| VS Code | `--code`, `--vscode`, `-c`, `--c` |
| IntelliJ IDEA | `--idea`, `--intellij`, `-i`, `--i` |
| Explorer | `--explorer`, `-e`, `--e` |
| Terminal | `--terminal`, `-t`, `--t` |

Exemplos equivalentes:

```bash
gg repo open hello-world --code
gg r o hello-world -c
gg ro hello-world -c
gg -ro hello-world --c
```

### Faculdade

| Comando | Alias | Funcao |
|---|---|---|
| `gg setup faculdade` | `gg s f` | Cria workspace da faculdade, clona repos `workspace: "faculdade"` e aplica Git local. |
| `gg clean faculdade` | `gg cl f` | Remove repositorios cadastrados da faculdade com checagem e confirmacao. |

### Git

| Comando | Alias | Funcao |
|---|---|---|
| `gg git whoami` | `gg g w` | Mostra usuario Git global e local. |
| `gg git config-local [repo]` | `gg g c [repo]` | Aplica `defaultGitUser` no repo atual ou em repo cadastrado. |

### Configuracoes

| Comando | Alias | Funcao |
|---|---|---|
| `gg config list` | `gg c l` | Mostra paths, origem lembrada, tipo da config, settings e repos cadastrados. |
| `gg config import [source]` | `gg c i [source]` | Importa configs de um repo privado ou pasta local. |
| `gg config push [source]` | `gg c p [source]` | Sobe as configs atuais para o repo privado com commit e push. |

### PC

| Comando | Alias | Funcao |
|---|---|---|
| `gg pc info` | `gg p i` | Mostra informacoes basicas do sistema. |
| `gg pc disco` | `gg p d` | Mostra discos locais. |
| `gg pc rede` | `gg p r` | Mostra configuracao de rede completa. |
| `gg pc ip` | `gg p a` | Mostra configuracao IP. |
| `gg pc dns` | `gg p n` | Testa resolucao DNS com `nslookup`. |

---

## Aliases Compactos

Aliases compactos existem para acoes frequentes de repositorio. Eles podem ser usados com ou sem hifen inicial.

| Alias | Equivale a |
|---|---|
| `gg rl`, `gg -rl` | `gg repo list` |
| `gg ra`, `gg -ra` | `gg repo add` |
| `gg rr <repo>`, `gg -rr <repo>` | `gg repo remove <repo>` |
| `gg rc <repo>`, `gg -rc <repo>` | `gg repo clone <repo>` |
| `gg ro <repo>`, `gg -ro <repo>` | `gg repo open <repo>` |
| `gg rs <repo>`, `gg -rs <repo>` | `gg repo status <repo>` |
| `gg rp <repo>`, `gg -rp <repo>` | `gg repo pull <repo>` |
| `gg rsa`, `gg -rsa` | `gg repo status-all` |
| `gg rpa`, `gg -rpa` | `gg repo pull-all` |
| `gg rd`, `gg -rd` | `gg repo doctor` |

`-h` e `--help` continuam reservados para ajuda.

---

## Seguranca

Regras importantes implementadas:

- `status-all` e `pull-all` continuam mesmo se um repo falhar;
- `pull` e `pull-all` pulam repos com alteracoes locais;
- a CLI detecta pastas que existem mas nao sao repos Git;
- a CLI bloqueia paths calculados fora do workspace;
- `clean faculdade` so remove repos cadastrados dentro do workspace da faculdade;
- `clean faculdade` sempre pede confirmacao antes de remover;
- erros de `safe.directory` sao explicados com o comando de correcao sugerido.

Quando o Git detectar dono diferente no Windows, a CLI vai sugerir algo como:

```bash
git config --global --add safe.directory "C:\.gg\default\hello-world"
```

Use isso apenas se voce confiar naquela pasta.

---

## Funcoes Internas Principais

| Arquivo | Funcoes / responsabilidade |
|---|---|
| `src/index.js` | Registra comandos, aliases e abre o menu quando `gg` roda sem argumentos. |
| `src/menu.js` | Fluxo do menu interativo, submenus e acoes. |
| `src/ui/banner.js` | Banner `GG` com `figlet`, `boxen`, subtitulo e cabecalho com links. |
| `src/ui/menu.js` | Wrapper do Inquirer com `Esc`, `Backspace`, tema e fallback de emojis. |
| `src/ui/theme.js` | Cores, gradiente, borda e tema dos prompts. |
| `src/ui/links.js` | Links configuraveis, hyperlinks de terminal e abertura via `open`. |
| `src/ui/terminal.js` | Deteccao de CMD, terminal moderno, hyperlink, emoji e largura. |
| `src/utils/aliases.js` | Traduz aliases compactos como `-ro` antes do Commander. |
| `src/utils/terminal.js` | Limpeza de tela e titulo da tela atual. |
| `src/utils/config.js` | Resolve a raiz do projeto e o data root, le e escreve JSON de configuracao. |
| `src/utils/paths.js` | Resolve workspaces em `C:\.gg`, paths de repos e validacoes de caminho seguro. |
| `src/utils/shell.js` | Executa comandos com saida herdada ou capturada. |
| `src/utils/editors.js` | Abre VS Code, IntelliJ, Explorer e terminal. |
| `src/commands/repo.js` | Cadastro, clone, open, status, pull, doctor e fluxos em lote. |
| `src/commands/setup.js` | Setup do workspace da faculdade. |
| `src/commands/clean.js` | Limpeza segura do workspace da faculdade. |
| `src/commands/git.js` | Whoami e configuracao Git local. |
| `src/commands/config.js` | Import, push, backup e listagem de configuracoes pessoais. |
| `src/commands/pc.js` | Diagnosticos simples do PC. |
| `src/commands/doctor.js` | Diagnostico geral da CLI. |

---

## Testes

A suite usa o runner nativo do Node:

```bash
npm.cmd test
```

Os testes cobrem:

- resolucao de config em desenvolvimento e via `GG_DATA_ROOT`;
- normalizacao e validacao de repos;
- workspaces padrao em `C:\.gg` e seguranca de paths;
- shell helpers sem lancar excecao em falhas esperadas;
- aliases compactos e aliases do Commander;
- import/push de configuracoes pessoais com backup;
- comandos de help sem efeitos destrutivos;
- renderizacao da UI do menu, links, bordas, banner e fallback de emojis.

---

## Estado Atual E Proximos Passos

Estado atual:

- nucleo de repositorios funcional;
- modo faculdade implementado;
- limpeza segura implementada;
- diagnosticos Git/PC/doctor implementados;
- aliases curtos implementados;
- README convertido para documentacao oficial.
