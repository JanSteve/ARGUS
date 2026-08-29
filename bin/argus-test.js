#!/usr/bin/env node

/**
 * ARGUS 2.0 Linux Native Core — Standalone Security Test CLI Runner
 * Run directly via: `node bin/argus-test.js` or `npm run test:security`
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Ensure test directory exists
const testWorkspace = path.join(projectRoot, "workspace_test");
if (!fs.existsSync(testWorkspace)) {
  fs.mkdirSync(testWorkspace, { recursive: true });
}

async function run() {
  try {
    // Dynamic import of TypeScript / compiled module
    const { runArgusSecuritySuite } = await import("../src/core/securityTestSuite.ts");
    const summary = await runArgusSecuritySuite(testWorkspace);

    if (summary.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (e) {
    console.error("Test suite runner error:", e);
    process.exit(1);
  }
}

run();
