import { execPiped, runAsyncMain } from "devcmd";
import fs from "fs-extra";
import path from "path";
import { YARN_COMMAND } from "./utils/commands";
import { dataDir, languageToolDir, reactUiDir, repoRoot } from "./utils/paths";

async function main() {
  await execPiped({
    command: YARN_COMMAND,
    args: ["install"],
    options: { cwd: reactUiDir },
  });

  await fs.remove(path.join(languageToolDir, "LanguageTool-5.4"));

  await execPiped({
    command: "unzip",
    args: ["LanguageTool-5.4.zip"],
    options: { cwd: languageToolDir },
  });

  await execPiped({
    command: "python3",
    args: ["copy_files.py"],
    options: { cwd: dataDir },
  });
}

runAsyncMain(main);
