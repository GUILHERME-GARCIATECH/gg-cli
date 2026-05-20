import chalk from "chalk";
import gradient from "gradient-string";
import { getBorderStyle, supportsEmoji } from "./terminal.js";

export const blueGradient = gradient(["#38bdf8", "#0ea5e9", "#2563eb"]);

export function icon(value, fallback = "", options = {}) {
  return supportsEmoji(options) ? value : fallback;
}

export function menuTheme(options = {}) {
  const modern = supportsEmoji(options);

  return {
    prefix: {
      idle: chalk.cyan("?"),
      done: modern ? chalk.green("✓") : chalk.green("OK")
    },
    icon: {
      cursor: chalk.cyan(modern ? "›" : ">")
    },
    style: {
      answer: (text) => chalk.cyan(text),
      highlight: (text) => chalk.cyanBright.bold(text),
      message: (text) => chalk.whiteBright.bold(text),
      description: (text) => chalk.gray(text),
      keysHelpTip: (keys) => keys
        .map(([key, action]) => `${chalk.cyan.bold(key)} ${chalk.gray(action)}`)
        .join(chalk.gray(" · "))
    }
  };
}

export function bannerBoxOptions(options = {}) {
  return {
    borderColor: "cyan",
    borderStyle: getBorderStyle(options),
    padding: {
      top: 1,
      right: 3,
      bottom: 1,
      left: 3
    },
    margin: {
      top: 1,
      bottom: 1
    },
    textAlignment: "left",
    float: "left"
  };
}
