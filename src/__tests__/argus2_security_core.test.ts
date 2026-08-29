/**
 * ARGUS 2.0 Linux Native Core Vitest Test Suite
 */

import { describe, it, expect, beforeAll } from "vitest";
import { runArgusSecuritySuite } from "../core/securityTestSuite";
import path from "path";
import fs from "fs";

describe("ARGUS 2.0 Linux Native Core & Security Policy Kernel", () => {
  const testWorkspace = path.join(process.cwd(), "workspace_test_vitest");

  beforeAll(() => {
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }
  });

  it("Executes and passes 100% of the ARGUS 2.0 Security & Adversarial Test Suite", async () => {
    const summary = await runArgusSecuritySuite(testWorkspace);

    expect(summary.total).toBe(10);
    expect(summary.passed).toBe(10);
    expect(summary.failed).toBe(0);

    const pocTest = summary.results.find((r) => r.name.includes("Milestone 1"));
    expect(pocTest?.passed).toBe(true);

    const shadowTest = summary.results.find((r) => r.name.includes("/etc/shadow"));
    expect(shadowTest?.passed).toBe(true);

    const sshTest = summary.results.find((r) => r.name.includes("SSH Key"));
    expect(sshTest?.passed).toBe(true);

    const traversalTest = summary.results.find((r) => r.name.includes("Path Traversal"));
    expect(traversalTest?.passed).toBe(true);

    const cmdTest = summary.results.find((r) => r.name.includes("sudo rm -rf"));
    expect(cmdTest?.passed).toBe(true);

    const injectionTest = summary.results.find((r) => r.name.includes("Prompt Injection"));
    expect(injectionTest?.passed).toBe(true);
  });
});
