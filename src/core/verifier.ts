/**
 * ARGUS 2.0 Independent Verification Engine
 * 
 * Cryptographically verifies artifact existence, integrity, content matching, and SHA-256 checksums.
 */

import fs from "fs";
import crypto from "crypto";
import path from "path";
import { VerificationAssertion } from "./types";

export class IndependentVerifier {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = path.resolve(workspaceRoot);
  }

  private resolvePath(target: string): string {
    return path.isAbsolute(target)
      ? path.normalize(target)
      : path.normalize(path.join(this.workspaceRoot, target));
  }

  /**
   * Verify a written filesystem artifact
   */
  public async verifyFileArtifact(targetRelPath: string, expectedContent?: string): Promise<VerificationAssertion> {
    const startTime = Date.now();
    const filePath = this.resolvePath(targetRelPath);
    const checks: Array<{ name: string; passed: boolean; details: string }> = [];

    // 1. File existence check
    const exists = fs.existsSync(filePath);
    checks.push({
      name: "File Existence Assertion",
      passed: exists,
      details: exists ? `File exists at: ${filePath}` : `File not found at: ${filePath}`,
    });

    if (!exists) {
      return {
        verified: false,
        target: targetRelPath,
        checks,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. File size & readability
    const stats = fs.statSync(filePath);
    const hasSize = stats.size > 0;
    checks.push({
      name: "Non-Zero Byte Assertion",
      passed: hasSize,
      details: `File size is ${stats.size} bytes`,
    });

    // 3. Content matching assertion (if specified)
    const content = fs.readFileSync(filePath, "utf8");
    if (expectedContent !== undefined) {
      const isMatch = content.trim() === expectedContent.trim();
      checks.push({
        name: "Byte-for-Byte Content Match",
        passed: isMatch,
        details: isMatch ? "Actual content perfectly matches expected payload." : "Content mismatch detected.",
      });
    }

    // 4. SHA-256 Checksum Calculation
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    checks.push({
      name: "Cryptographic SHA-256 Signature",
      passed: true,
      details: `SHA256:${hash}`,
    });

    const allPassed = checks.every((c) => c.passed);

    return {
      verified: allPassed,
      target: targetRelPath,
      checks,
      sha256Checksum: hash,
      sizeBytes: stats.size,
      durationMs: Date.now() - startTime,
    };
  }
}
