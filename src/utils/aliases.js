const COMPACT_ALIASES = {
  rl: ["repo", "list"],
  ra: ["repo", "add"],
  rr: ["repo", "remove"],
  rc: ["repo", "clone"],
  ro: ["repo", "open"],
  rs: ["repo", "status"],
  rp: ["repo", "pull"],
  rsa: ["repo", "status-all"],
  rpa: ["repo", "pull-all"],
  rd: ["repo", "doctor"]
};

const OPEN_OPTION_ALIASES = {
  "--c": "--code",
  "--i": "--idea",
  "--e": "--explorer",
  "--t": "--terminal"
};

function stripCompactPrefix(value) {
  if (!value || value === "-h" || value === "--help") {
    return value;
  }

  if (value.startsWith("-") && !value.startsWith("--")) {
    return value.slice(1);
  }

  return value;
}

function translateOpenOptionAliases(args) {
  return args.map((arg) => OPEN_OPTION_ALIASES[arg] || arg);
}

export function translateAliases(argv) {
  const [nodePath, scriptPath, ...userArgs] = argv;

  if (userArgs.length === 0) {
    return argv;
  }

  const [firstArg, ...restArgs] = userArgs;
  const compactName = stripCompactPrefix(firstArg);
  const translatedCommand = COMPACT_ALIASES[compactName];
  const translatedRest = translateOpenOptionAliases(restArgs);

  if (!translatedCommand) {
    return [nodePath, scriptPath, firstArg, ...translatedRest];
  }

  return [nodePath, scriptPath, ...translatedCommand, ...translatedRest];
}

export function getCompactAliases() {
  return { ...COMPACT_ALIASES };
}
