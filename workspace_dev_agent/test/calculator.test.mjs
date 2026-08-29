import { calculateTierDiscount, calculateFinalTotal } from "../src/calculator.mjs";

console.log("RUNNING FINANCIAL TEST SUITE...");

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error("❌ FAIL: " + message);
    failures++;
  } else {
    console.log("✓ PASS: " + message);
  }
}

// Test 1: Tier 1
assert(calculateTierDiscount(100, "TIER_1") === 5, "Tier 1 receives 5% discount ($5)");

// Test 2: Tier 2
assert(calculateTierDiscount(100, "TIER_2") === 15, "Tier 2 receives 15% discount ($15)");

// Test 3: Tier 3 (Fails until agent fixes calculator.mjs)
assert(calculateTierDiscount(100, "TIER_3") === 25, "Tier 3 receives 25% discount ($25)");

// Test 4: Final Total Tier 3
assert(calculateFinalTotal(200, "TIER_3") === 150, "Tier 3 $200 total after 25% discount is $150");

if (failures > 0) {
  console.error("\nTEST SUITE FAILED: " + failures + " failing assertion(s)");
  process.exit(1);
} else {
  console.log("\nTEST SUITE PASSED: All 4 assertions verified.");
  process.exit(0);
}
