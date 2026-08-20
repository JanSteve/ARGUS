#!/usr/bin/env node

import { spawn, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the root directory of the project
const projectRoot = path.resolve(__dirname, "..");

// Auto-cleanup port 1420 to prevent blank white screens from zombie processes
try {
  if (process.platform !== "win32") {
    const pids = execSync("lsof -t -i :1420", { encoding: "utf8" }).trim();
    if (pids) {
      const pidList = pids.split("\n");
      for (const pid of pidList) {
        if (pid) {
          console.log(`Port 1420 is in use by PID ${pid}. Cleaning up...`);
          execSync(`kill -9 ${pid}`);
        }
      }
    }
  } else {
    const output = execSync('netstat -ano | findstr :1420', { encoding: "utf8" });
    const lines = output.split("\n");
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== "0" && !isNaN(pid)) {
        console.log(`Port 1420 is in use by PID ${pid}. Cleaning up...`);
        execSync(`taskkill /F /PID ${pid}`);
      }
    }
  }
} catch (e) {
  // Ignore if port is free
}

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
