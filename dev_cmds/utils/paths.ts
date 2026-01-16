import { resolve } from "path";

const repoRoot = resolve(__dirname, "..", "..");

const dataDir = resolve(repoRoot, "data");
const reactUiDir = resolve(repoRoot, "react-ui");
const backendDir = resolve(repoRoot, "backend");
const serverDir = resolve(backendDir, "src", "diversifix_server");

export { repoRoot, dataDir, reactUiDir, backendDir, serverDir };
