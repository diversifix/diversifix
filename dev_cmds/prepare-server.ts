import { execPiped, runAsyncMain } from "devcmd";
import fs from "fs-extra";
import path from "path";
import { DEVCMD_COMMAND } from "./utils/commands";
import { dataDir, reactUiDir, serverDir } from "./utils/paths";

async function main() {
  await execPiped({ command: DEVCMD_COMMAND, args: ["build-react-app"] });

  const staticFileDir = path.join(serverDir, "static");
  const serverDataDir = path.join(serverDir, "data");

  await fs.remove(staticFileDir);
  await fs.mkdirp(staticFileDir);
  await fs.copy(path.join(reactUiDir, "build"), staticFileDir);

  await fs.copy(path.join(dataDir, "unified.csv"), path.join(serverDataDir, "unified.csv"));
}

runAsyncMain(main);