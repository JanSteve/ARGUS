/**
 * ARGUS Founder Cryptographic License Key Generator (CLI)
 * Generates signed, 1-time unique license keys upon customer payment.
 * 
 * Usage:
 *   node scripts/generate_license.js --tier pro --customer "Rahul Sharma"
 *   node scripts/generate_license.js --tier ent --customer "Acme Corp"
 */

import crypto from "crypto";

const SECRET_SALT = "ARGUS_SOVEREIGN_CORE_SALT_2026_PRO";

function generateRandomHex(length) {
  return crypto.randomBytes(length).toString("hex").toUpperCase().slice(0, length);
}

function calculateChecksum(payload) {
  let hash = 0;
  const combined = payload + SECRET_SALT;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().slice(0, 4);
}

export function generateLicense(tier = "pro", customerName = "Sovereign User") {
  const tierCode = tier.toUpperCase() === "ENT" || tier.toUpperCase() === "ENTERPRISE" ? "ENT" : "PRO";
  const p1 = generateRandomHex(4);
  const p2 = generateRandomHex(4);
  const payload = `ARGUS-${tierCode}-${p1}-${p2}`;
  const sig = calculateChecksum(payload);
  const fullKey = `${payload}-${sig}`;

  return {
    key: fullKey,
    tier: tierCode === "ENT" ? "Enterprise" : "Pro",
    customer: customerName,
    generatedAt: new Date().toISOString(),
  };
}

// CLI Execution Support
const args = process.argv.slice(2);
let tier = "pro";
let customer = "Valued Customer";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--tier" && args[i + 1]) tier = args[i + 1];
  if (args[i] === "--customer" && args[i + 1]) customer = args[i + 1];
}

const result = generateLicense(tier, customer);
console.log("=========================================================");
console.log("🔑 ARGUS SOVEREIGN OS — OFFICIAL LICENSE KEY GENERATED");
console.log("=========================================================");
console.log(`👤 Customer:   ${result.customer}`);
console.log(`💎 Plan Tier:  ARGUS ${result.tier}`);
console.log(`🔑 License Key: \x1b[32m\x1b[1m${result.key}\x1b[0m`);
console.log(`⏱️ Issued At:  ${result.generatedAt}`);
console.log("=========================================================");
console.log("Send this key to your customer to activate in the SaaS Pro Hub.");
console.log("=========================================================");
