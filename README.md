# GG CLI

CLI pessoal para automatizar tarefas do dia a dia, principalmente gerenciamento de repositórios, preparação de ambiente de estudos/trabalho e abertura rápida de projetos.

A ideia inicial é substituir e evoluir o antigo `.bat` usado para clonar, abrir e apagar repositórios em máquinas temporárias, como computadores da faculdade, mantendo um fluxo simples, rápido e seguro.

> Projeto pessoal em fase inicial.  
> Não é uma ferramenta pública pronta para uso geral, mas um utilitário feito para meu próprio fluxo de estudos, trabalho e automação.

---

## Objetivo

Centralizar comandos úteis em uma única ferramenta de terminal.

Exemplos de uso planejados:

```bash
gg
gg repo list
gg repo open licita --code
gg repo open obi-java --idea
gg setup faculdade
gg clean faculdade
```

A CLI deve funcionar como um “canivete suíço” pessoal para:

- gerenciar repositórios;
- clonar projetos rapidamente;
- abrir projetos no VS Code ou IntelliJ IDEA;
- preparar ambiente temporário de estudo;
- limpar arquivos criados pela própria ferramenta;
- executar diagnósticos simples futuramente.

---

## Stack inicial

A primeira versão será feita em **JavaScript com Node.js**, sem TypeScript no início.

### Tecnologias

- Node.js
- JavaScript
- npm
- Git
- JSON para configuração local

### Bibliotecas previstas

```bash
npm install commander @inquirer/prompts chalk
```

| Biblioteca | Função |
|---|---|
| `commander` | Criar comandos diretos como `gg repo open licita` |
| `@inquirer/prompts` | Criar menus interativos no terminal |
| `chalk` | Melhorar a visualização com cores |
| `fs/path` | Ler arquivos de configuração e manipular caminhos |
| `child_process` | Executar comandos como `git clone`, `git pull` e abrir editores |

---

## Funcionalidades principais

## 1. Gerenciamento de repositórios

Essa será a funcionalidade principal da primeira versão.

A CLI deverá permitir:

- listar repositórios cadastrados;
- adicionar novo repositório;
- remover repositório;
- clonar repositório;
- abrir repositório existente;
- atualizar repositório com `git pull`;
- abrir no VS Code;
- abrir no IntelliJ IDEA;
- abrir no Explorer;
- abrir terminal dentro da pasta;
- verificar status Git;
- atualizar todos os repositórios;
- verificar alterações locais.

Exemplos:

```bash
gg repo list
gg repo add licita https://github.com/usuario/licita-assessoria.git
gg repo remove licita
gg repo clone licita
gg repo open licita --code
gg repo open obi-java --idea
gg repo status licita
gg repo status-all
gg repo pull licita
gg repo pull-all
```

---

## 2. Menu interativo

Além dos comandos diretos, a CLI também deverá ter um menu interativo.

Ao rodar:

```bash
gg
```

Exemplo de menu:

```text
========================================
 GG CLI - Ferramentas do Guilherme
========================================

? O que você quer fazer?
❯ Repositórios
  Faculdade
  Java / OBI
  Node.js
  Manutenção do PC
  Configurações
  Sair
```

Dentro de `Repositórios`:

```text
? Escolha uma ação:
❯ Abrir repositório
  Clonar repositório
  Atualizar todos
  Ver status de todos
  Adicionar repositório
  Remover repositório
  Voltar
```

---

## 3. Modo faculdade

Funcionalidade pensada para uso em computadores temporários.

Comando planejado:

```bash
gg setup faculdade
```

Esse comando poderá:

- criar uma pasta temporária de trabalho;
- clonar repositórios principais de estudo;
- configurar Git localmente;
- abrir o projeto no editor disponível.

Exemplo de workspace:

```text
C:\gg-faculdade
```

Comando de limpeza:

```bash
gg clean faculdade
```

Esse comando deverá:

- verificar se existem alterações não commitadas;
- avisar quais repositórios têm mudanças;
- pedir confirmação antes de apagar;
- apagar apenas a pasta criada pela ferramenta;
- evitar limpar arquivos de outros usuários;
- evitar limpar a lixeira inteira automaticamente.

---

## 4. Abertura de editores

A CLI deverá suportar abertura rápida nos principais editores usados.

### VS Code

```bash
gg repo open licita --code
```

Internamente:

```bash
code caminho/do/repositorio
```

### IntelliJ IDEA

```bash
gg repo open obi-java --idea
```

A CLI deverá tentar encontrar o IntelliJ por:

- comando `idea`;
- comando `idea64.exe`;
- caminhos comuns de instalação no Windows;
- configuração manual em `settings.json`.

---

## Configuração dos repositórios

Os repositórios devem ficar em um arquivo JSON, fora do código da CLI.

Exemplo de `repos.json`:

```json
[
  {
    "name": "licita",
    "description": "Sistema de gestão de licitações da Assessoria Tech",
    "url": "https://github.com/usuario/licita-assessoria.git",
    "type": "node",
    "defaultEditor": "vscode",
    "workspace": "trabalho"
  },
  {
    "name": "obi-java",
    "description": "Repositório de estudos para a OBI usando Java",
    "url": "https://github.com/usuario/obi-java.git",
    "type": "java",
    "defaultEditor": "intellij",
    "workspace": "faculdade"
  }
]
```

---

## Configurações gerais

Exemplo de `settings.json`:

```json
{
  "defaultWorkspace": "C:\\gg-workspace",
  "facultyWorkspace": "C:\\gg-faculdade",
  "defaultGitUser": {
    "name": "Guilherme Garcia",
    "email": "email@example.com"
  },
  "editors": {
    "vscode": "code",
    "intellij": "idea"
  },
  "safeClean": true
}
```

Esse arquivo poderá guardar:

- pasta padrão de trabalho;
- pasta temporária da faculdade;
- editor padrão;
- nome e e-mail Git;
- comportamento de limpeza;
- caminhos manuais de programas.

---

## Estrutura inicial do projeto

```text
gg-cli/
├─ package.json
├─ README.md
├─ src/
│  ├─ index.js
│  ├─ menu.js
│  ├─ commands/
│  │  ├─ repo.js
│  │  ├─ git.js
│  │  ├─ setup.js
│  │  ├─ clean.js
│  │  └─ pc.js
│  └─ utils/
│     ├─ shell.js
│     ├─ config.js
│     ├─ paths.js
│     └─ editors.js
├─ config/
│  ├─ repos.json
│  └─ settings.json
└─ portable/
   └─ abrir-repos.bat
```

---

## Ideia dos arquivos

### `src/index.js`

Arquivo principal da CLI.

Responsável por:

- iniciar o programa;
- registrar comandos;
- abrir menu interativo quando nenhum comando for informado.

### `src/menu.js`

Responsável pelos menus interativos usando `@inquirer/prompts`.

### `src/commands/repo.js`

Comandos relacionados a repositórios:

- `list`
- `add`
- `remove`
- `clone`
- `open`
- `pull`
- `status`

### `src/commands/setup.js`

Comandos para preparar ambientes.

Exemplo:

```bash
gg setup faculdade
```

### `src/commands/clean.js`

Comandos de limpeza segura.

Exemplo:

```bash
gg clean faculdade
```

### `src/utils/`

Funções auxiliares para:

- executar comandos no sistema;
- ler e salvar configurações;
- montar caminhos;
- abrir VS Code, IntelliJ, Explorer e terminal.

---

## Instalação para desenvolvimento

Clonar o projeto:

```bash
git clone https://github.com/usuario/gg-cli.git
cd gg-cli
```

Instalar dependências:

```bash
npm install
```

Rodar localmente:

```bash
npm start
```

Instalar como comando local durante o desenvolvimento:

```bash
npm link
```

Depois disso, o comando `gg` deve ficar disponível no terminal:

```bash
gg
```

---

## Exemplo de `package.json`

```json
{
  "name": "gg-cli",
  "version": "0.1.0",
  "description": "CLI pessoal para gerenciamento de repositórios, estudos e automações locais.",
  "type": "module",
  "bin": {
    "gg": "./src/index.js"
  },
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "@inquirer/prompts": "latest",
    "chalk": "latest",
    "commander": "latest"
  }
}
```

---

## Segurança e cuidados

A CLI deve priorizar segurança, principalmente porque pode ser usada em computadores temporários.

Regras importantes:

- não apagar pastas fora do workspace configurado;
- verificar alterações Git antes de remover repositórios;
- pedir confirmação antes de ações destrutivas;
- evitar limpar lixeira automaticamente;
- evitar instalar programas sem confirmação;
- mostrar claramente o que será feito;
- não salvar senhas ou tokens diretamente em arquivos comuns.

---

## Limpeza segura

Antes de apagar uma pasta de repositório, a CLI deve executar:

```bash
git status --porcelain
```

Se houver alterações locais, a CLI deve avisar e bloquear ou pedir confirmação explícita.

Exemplo de aviso:

```text
Este repositório possui alterações locais não commitadas.
Faça commit, push ou backup antes de apagar.
```

---

## Modo portátil

Mesmo com a CLI em Node.js, pode ser interessante manter um `.bat` portátil.

Motivos:

- funciona em mais máquinas Windows;
- não depende de Node.js;
- é útil em computadores bloqueados;
- serve como alternativa rápida na faculdade.

Arquivo previsto:

```text
portable/abrir-repos.bat
```

A CLI Node será a ferramenta principal, mas o `.bat` pode continuar existindo como plano B.

---

## Roadmap inicial

### Versão 0.1

- criar estrutura do projeto;
- configurar `package.json`;
- criar comando `gg`;
- abrir menu interativo;
- criar `repos.json`;
- listar repositórios cadastrados.

### Versão 0.2

- clonar repositório;
- abrir repositório no Explorer;
- abrir repositório no VS Code;
- abrir repositório no IntelliJ IDEA.

### Versão 0.3

- adicionar repositório pelo menu;
- remover repositório pelo menu;
- validar URL;
- salvar alterações no `repos.json`.

### Versão 0.4

- `git status`;
- `git pull --ff-only`;
- `status-all`;
- `pull-all`;
- alerta de alterações locais.

### Versão 0.5

- modo faculdade;
- criar workspace temporário;
- clonar repositórios de estudo;
- limpar workspace com segurança.

### Futuro

- configurações em `settings.json`;
- comandos de manutenção de PC;
- diagnóstico de rede;
- instalador automático;
- versão empacotada como `.exe`;
- possível migração para TypeScript.

---

## Comandos planejados

```bash
gg
gg menu

gg repo list
gg repo add
gg repo remove
gg repo clone
gg repo open
gg repo pull
gg repo pull-all
gg repo status
gg repo status-all

gg setup faculdade
gg clean faculdade

gg git whoami
gg git config-local

gg pc info
gg pc disco
gg pc rede
gg pc ip
gg pc dns
```
