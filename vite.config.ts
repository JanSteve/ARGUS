import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";

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
  // Ignore if port is free or commands fail
}

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/test/setup.ts",
  },
}));
