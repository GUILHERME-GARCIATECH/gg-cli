export function clearScreen() {
  if (process.env.GG_NO_CLEAR === "1") {
    return;
  }

  process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
}

export function showScreenTitle(title) {
  clearScreen();

  if (title) {
    console.log(`== ${title} ==`);
    console.log("");
  }
}
