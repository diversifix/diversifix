import { execPiped, runAsyncMain } from "devcmd";
import { backendDir } from "./utils/paths";

async function main() {
  // Sync dependencies with uv
  await execPiped({
    command: "uv",
    args: ["sync"],
    options: {
      cwd: backendDir,
    },
  });

  // Start the API with uvicorn
  await execPiped({
    command: "uv",
    args: [
      "run",
      "uvicorn",
      "diversifix_server.app:app",
      "--host", "localhost",
      "--port", "8081",
      "--reload",
    ],
    options: {
      cwd: backendDir,
    },
  });
}

runAsyncMain(main);
