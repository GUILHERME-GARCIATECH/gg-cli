import readline from "node:readline";
import chalk from "chalk";
import { input, select } from "@inquirer/prompts";
import { clearScreen, showScreenTitle } from "../utils/terminal.js";
import { icon, menuTheme } from "./theme.js";

export const MENU_EXIT = Symbol("menu-exit");
export const MENU_BACK = Symbol("menu-back");

export const ICONS = {
  repos: "\u{1F4C1}",
  faculty: "\u{1F393}",
  git: "\u{1F310}",
  pc: "\u{1F6E0}\uFE0F",
  settings: "\u2699\uFE0F",
  doctor: "\u{1FA7A}",
  links: "\u{1F517}",
  exit: "\u{1F6AA}",
  back: "\u21A9\uFE0F",
  open: "\u{1F680}"
};

export function isMenuExit(value) {
  return value === MENU_EXIT;
}

export function isMenuBack(value) {
  return value === MENU_BACK;
}

export function formatChoiceLabel(choice, options = {}) {
  const label = choice.label || choice.name || String(choice.value);
  const choiceIcon = choice.icon ? icon(choice.icon, "", options) : "";

  return choiceIcon ? `${choiceIcon} ${label}` : label;
}

function normalizeChoices(choices, options = {}) {
  return choices.map((choice) => ({
    ...choice,
    name: formatChoiceLabel(choice, options),
    short: choice.short || choice.label || choice.name || String(choice.value)
  }));
}

function isExitKey(key) {
  return key?.name === "escape" || (key?.ctrl && key?.name === "c");
}

function getPromptResultFromError(error) {
  if (error?.name === "AbortPromptError") {
    return error.cause || MENU_EXIT;
  }

  if (["ExitPromptError", "CancelPromptError"].includes(error?.name)) {
    return MENU_EXIT;
  }

  throw error;
}

async function runPrompt(prompt, config, {
  allowBack = false,
  inputStream = process.stdin,
  outputStream = process.stdout,
  terminalOptions = {}
} = {}) {
  const controller = new AbortController();

  function onKeypress(_input, key) {
    if (controller.signal.aborted) {
      return;
    }

    if (isExitKey(key)) {
      controller.abort(MENU_EXIT);
      return;
    }

    if (allowBack && key?.name === "backspace") {
      controller.abort(MENU_BACK);
    }
  }

  function onData(data) {
    if (controller.signal.aborted) {
      return;
    }

    const value = data?.toString("utf8");

    if (value === "\x1B") {
      controller.abort(MENU_EXIT);
      return;
    }

    if (allowBack && (value === "\x7F" || value === "\b")) {
      controller.abort(MENU_BACK);
    }
  }

  if (inputStream.isTTY) {
    readline.emitKeypressEvents(inputStream);
    inputStream.on("keypress", onKeypress);
    inputStream.on("data", onData);
  }

  try {
    return await prompt(
      {
        ...config,
        theme: {
          ...menuTheme(terminalOptions),
          ...config.theme
        }
      },
      {
        input: inputStream,
        output: outputStream,
        signal: controller.signal,
        clearPromptOnDone: true
      }
    );
  } catch (error) {
    return getPromptResultFromError(error);
  } finally {
    if (inputStream.isTTY) {
      inputStream.off("keypress", onKeypress);
      inputStream.off("data", onData);
    }
  }
}

export async function promptMenu({
  title,
  message,
  choices,
  allowBack = false,
  renderHeader = null,
  pageSize = 10,
  inputStream = process.stdin,
  outputStream = process.stdout,
  terminalOptions = {}
}) {
  if (renderHeader) {
    clearScreen();
    renderHeader();
  } else {
    showScreenTitle(title);
  }

  const suffix = allowBack ? "Esc sai, Backspace volta" : "Esc sai";

  return await runPrompt(select, {
    message: `${message} ${chalk.gray(`(${suffix})`)}`,
    choices: normalizeChoices(choices, {
      stdout: outputStream,
      ...terminalOptions
    }),
    pageSize
  }, {
    allowBack,
    inputStream,
    outputStream,
    terminalOptions
  });
}

export async function promptInput({
  message,
  defaultValue = "",
  inputStream = process.stdin,
  outputStream = process.stdout,
  terminalOptions = {}
}) {
  return await runPrompt(input, {
    message: `${message} ${chalk.gray("(Esc sai)")}`,
    default: defaultValue
  }, {
    inputStream,
    outputStream,
    terminalOptions
  });
}
