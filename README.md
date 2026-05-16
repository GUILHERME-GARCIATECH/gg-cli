# GG CLI

CLI pessoal para automatizar tarefas do dia a dia: gerenciamento de repositorios, abertura rapida de projetos, setup de ambiente de faculdade, limpeza segura e diagnosticos simples do PC.

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
gg repo open dev-study-roadmap --code
gg ro dev-study-roadmap -c
gg -ro dev-study-roadmap --c
gg setup faculdade
gg clean faculdade
gg doctor
```

---

## Instalacao E Desenvolvimento

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

A CLI le configuracoes a partir da raiz real do projeto, nao do diretorio atual do terminal. Isso permite rodar `gg` de qualquer pasta.

### `config/repos.json`

Lista de repositorios cadastrados:

```json
[
  {
    "name": "dev-study-roadmap",
    "description": "Roadmap pessoal de estudos em desenvolvimento",
    "url": "https://github.com/GUILHERME-GARCIATECH/dev-study-roadmap.git",
    "type": "study",
    "defaultEditor": "vscode",
    "workspace": "faculdade"
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
  "defaultWorkspace": "C:\\gg-workspace",
  "facultyWorkspace": "C:\\gg-faculdade",
  "defaultGitUser": {
    "name": "Guilherme Garcia",
    "email": "guilherme.garciatech@gmail.com"
  },
  "editors": {
    "vscode": "code",
    "intellij": "idea"
  },
  "safeClean": true
}
```

Campos usados:

| Campo | Funcao |
|---|---|
| `defaultWorkspace` | Pasta base para repositorios comuns. |
| `facultyWorkspace` | Pasta temporaria usada pelo modo faculdade. |
| `defaultGitUser` | Nome e email aplicados com `gg git config-local` e `gg setup faculdade`. |
| `editors.vscode` | Comando ou caminho do VS Code. |
| `editors.intellij` | Comando ou caminho do IntelliJ IDEA. |
| `safeClean` | Mantem limpeza conservadora, com confirmacao explicita. |

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

O menu e auto-limpante:

- antes de mostrar um menu, a tela e limpa;
- antes de executar uma acao, a tela e limpa e mostra apenas aquela acao;
- depois de `Pressione Enter para continuar...`, a tela e limpa e volta ao menu anterior.

Para depurar sem limpar a tela:

```bash
$env:GG_NO_CLEAR="1"
gg
```

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
gg repo open dev-study-roadmap --code
gg r o dev-study-roadmap -c
gg ro dev-study-roadmap -c
gg -ro dev-study-roadmap --c
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
git config --global --add safe.directory "C:\gg-faculdade\dev-study-roadmap"
```

Use isso apenas se voce confiar naquela pasta.

---

## Funcoes Internas Principais

| Arquivo | Funcoes / responsabilidade |
|---|---|
| `src/index.js` | Registra comandos, aliases e abre o menu quando `gg` roda sem argumentos. |
| `src/menu.js` | Menu interativo auto-limpante. |
| `src/utils/aliases.js` | Traduz aliases compactos como `-ro` antes do Commander. |
| `src/utils/terminal.js` | Limpeza de tela e titulo da tela atual. |
| `src/utils/config.js` | Le e escreve JSON a partir da raiz real do projeto. |
| `src/utils/paths.js` | Resolve workspaces, paths de repos e validacoes de caminho seguro. |
| `src/utils/shell.js` | Executa comandos com saida herdada ou capturada. |
| `src/utils/editors.js` | Abre VS Code, IntelliJ, Explorer e terminal. |
| `src/commands/repo.js` | Cadastro, clone, open, status, pull, doctor e fluxos em lote. |
| `src/commands/setup.js` | Setup do workspace da faculdade. |
| `src/commands/clean.js` | Limpeza segura do workspace da faculdade. |
| `src/commands/git.js` | Whoami e configuracao Git local. |
| `src/commands/pc.js` | Diagnosticos simples do PC. |
| `src/commands/doctor.js` | Diagnostico geral da CLI. |

---

## Testes

A suite usa o runner nativo do Node:

```bash
npm.cmd test
```

Os testes cobrem:

- resolucao de config fora da pasta do projeto;
- normalizacao e validacao de repos;
- seguranca de paths;
- shell helpers sem lancar excecao em falhas esperadas;
- aliases compactos e aliases do Commander;
- comandos de help sem efeitos destrutivos.

---

## Estado Atual E Proximos Passos

Estado atual:

- nucleo de repositorios funcional;
- modo faculdade implementado;
- limpeza segura implementada;
- diagnosticos Git/PC/doctor implementados;
- aliases curtos implementados;
- README convertido para documentacao oficial.
