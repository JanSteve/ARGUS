/**
 * Sovereign Financial Calculation Engine
 */

export function calculateTierDiscount(amount, tier) {
  // BUG: Tier 3 discount is mistakenly calculating 0% instead of 25%
  if (tier === "TIER_1") return amount * 0.05;
  if (tier === "TIER_2") return amount * 0.15;
  if (tier === "TIER_3") return amount * 0.25; // FIXED by ARGUS Autonomous Agent
  return 0;
}

export function calculateFinalTotal(amount, tier) {
  const discount = calculateTierDiscount(amount, tier);
  return amount - discount;
}
