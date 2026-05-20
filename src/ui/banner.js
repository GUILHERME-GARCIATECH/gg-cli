import boxen from "boxen";
import chalk from "chalk";
import figlet from "figlet/browser";
import ansiShadow from "figlet/fonts/ANSI Shadow";
import doom from "figlet/fonts/Doom";
import smallSlant from "figlet/fonts/Small Slant";
import stringWidth from "string-width";
import wrapAnsi from "wrap-ansi";
import { formatHeaderLinks, resolveLinks } from "./links.js";
import { bannerBoxOptions, blueGradient } from "./theme.js";
import { getTerminalWidth, isModernTerminal } from "./terminal.js";

export const DEFAULT_SUBTITLE = "Personal Developer CLI";

figlet.parseFont("ANSI Shadow", ansiShadow);
figlet.parseFont("Doom", doom);
figlet.parseFont("Small Slant", smallSlant);

function createFigletLogo(font) {
  return figlet.textSync("GG", {
    font,
    horizontalLayout: "fitted",
    verticalLayout: "default"
  }).trimEnd();
}

export function selectLogoFont({
  width = getTerminalWidth(),
  modern = isModernTerminal()
} = {}) {
  if (width < 34) {
    return "compact";
  }

  if (!modern) {
    return width >= 44 ? "Doom" : "Small Slant";
  }

  return width >= 44 ? "ANSI Shadow" : "Small Slant";
}

export function createLogo({
  width = getTerminalWidth(),
  modern = isModernTerminal()
} = {}) {
  const font = selectLogoFont({ width, modern });

  if (font === "compact") {
    return chalk.cyanBright.bold("GG CLI");
  }

  const logo = createFigletLogo(font);
  return modern ? blueGradient(logo) : chalk.cyanBright.bold(logo);
}

export function createBannerContent({
  width = getTerminalWidth(),
  subtitle = DEFAULT_SUBTITLE,
  links = resolveLinks(),
  terminalOptions = {}
} = {}) {
  const innerWidth = Math.max(20, Math.min(54, width - 10));
  const modern = isModernTerminal(terminalOptions);
  const logo = createLogo({ width, modern });
  const linkText = formatHeaderLinks(links, terminalOptions);
  const lines = [
    logo,
    "",
    chalk.whiteBright(subtitle)
  ];

  if (linkText) {
    const wrappedLinks = stringWidth(linkText) > innerWidth
      ? wrapAnsi(linkText, innerWidth, { hard: false })
      : linkText;

    lines.push("", chalk.cyan(wrappedLinks));
  }

  return lines.join("\n");
}

export function renderBanner(options = {}) {
  const width = options.width ?? getTerminalWidth(options.stdout, options.env);
  const terminalOptions = {
    env: options.env,
    stdout: options.stdout,
    platform: options.platform
  };
  const content = createBannerContent({
    ...options,
    width,
    terminalOptions
  });

  return boxen(content, bannerBoxOptions(terminalOptions));
}

export function printBanner(options = {}) {
  console.log(renderBanner(options));
}
