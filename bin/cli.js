#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the root directory of the project
const projectRoot = path.resolve(__dirname, "..");

console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[36m%s\x1b[0m", "       ARGUS Sovereign OS — Launching Core        ");
console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log(`Working directory: ${projectRoot}`);

// Check arguments
const args = process.argv.slice(2);
const runWebOnly = args.includes("--web");

let cmd = "npm";
let runArgs = ["run", "tauri", "dev"];

if (runWebOnly) {
  console.log("Starting web-only development server (port 5173)...");
  runArgs = ["run", "dev"];
} else {
  console.log("Starting local AI environment and Tauri desktop window...");
}

// Spawn the process
const child = spawn(cmd, runArgs, {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

child.on("close", (code) => {
  console.log(`ARGUS process exited with code ${code}`);
  process.exit(code || 0);
});
