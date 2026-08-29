/**
 * ARGUS Code Fortress & Data Loss Prevention (DLP) Engine
 * 
 * Maximum Security Armor for:
 * 1. Financial & Payment Cards (Luhn Algorithm Validation & Auto-Redaction)
 * 2. Cloud API Keys & Cryptographic Secrets (Stripe, OpenAI, AWS, GitHub, RSA Keys)
 * 3. Proprietary Source Code & IP Protection (Anti-Exfiltration Shield)
 * 4. Prompt Injection & Jailbreak Traps
 */

export interface DLPInspectionResult {
  hasSensitiveData: boolean;
  categories: ("PAYMENT_CARD" | "CVV" | "BANK_ACCOUNT" | "UPI_ID" | "API_KEY" | "PRIVATE_KEY" | "PROMPT_INJECTION" | "SOURCE_CODE_LEAK")[];
  redactedContent: string;
  matchedRules: string[];
  severity: "CLEAN" | "LOW" | "HIGH" | "CRITICAL";
  riskDescription: string;
}

// ─── 1. Luhn Algorithm for Credit Card Validation ───
export function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// ─── 2. Regular Expression Defense Matrix ───
const PAYMENT_PATTERNS = {
  // Visa, Mastercard, Amex, Discover, Diners Club, JCB
  creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})\b/g,
  
  // Generic 13-19 digit card sequence with hyphens/spaces
  cardFormatted: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{1,7}\b/g,
  
  // CVV / CVC (3 or 4 digits associated with card keywords)
  cvv: /(?:cvv|cvc|security\s*code|card\s*verification)[\s:]*([0-9]{3,4})\b/gi,
  
  // UPI IDs (India)
  upiId: /\b[a-zA-Z0-9.\-_]{2,256}@(okhdfcbank|okaxis|okicici|oksbi|paytm|ybl|apl|upi)\b/gi,
  
  // IBAN International Bank Account Number
  iban: /\b[A-Z]{2}[0-9]{2}(?:[ ]?[0-9A-Z]{4}){3,7}(?:[ ]?[0-9A-Z]{1,2})?\b/g,
};

const SECRET_PATTERNS = {
  // Stripe Secret Keys
  stripeSecret: /(?:sk_live|rk_live|sk_test)_[0-9a-zA-Z]{24,99}/g,
  
  // OpenAI API Keys
  openAiKey: /sk-(?:proj-)?[a-zA-Z0-9_-]{32,128}/g,
  
  // AWS Access Key ID & Secret
  awsAccessKey: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
  
  // GitHub Personal Access Tokens
  githubToken: /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,255}\b/g,
  
  // Google / Firebase API Keys
  googleApiKey: /AIzaSy[a-zA-Z0-9_-]{33}/g,
  
  // Private Key Headers
  privateKeyHeader: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/gi,
  
  // Generic Bearer Token in text
  bearerToken: /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
};

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
  /reveal\s+(?:your\s+)?(?:system\s+prompt|instructions|source\s+code)/i,
  /print\s+(?:all\s+)?(?:environment\s+variables|\.env|secrets)/i,
  /dump\s+(?:the\s+)?(?:database|memory|passwords|vault)/i,
  /you\s+are\s+now\s+(?:unrestricted|in\s+god\s+mode|dan\s+mode)/i,
  /bypass\s+(?:the\s+)?(?:firewall|governance|dlp|permission\s+kernel)/i,
];

const CODE_EXFILTRATION_PATTERNS = [
  /export\s+const\s+Desktop/i,
  /import\s+.*from\s+['"]\.\/Desktop/i,
  /\bAgentFirewallEngine\b/i,
  /\bSovereignMemoryEngine\b/i,
  /\bCheckpointManager\b/i,
  /\btauri::generate_context!/i,
];

// ─── 3. Core DLP Inspection & Redaction Engine ───
export class CodeFortressDLP {
  /**
   * Inspect any string payload for payment, secret, injection, or code leaks
   */
  public static inspectPayload(content: string, context: string = "runtime"): DLPInspectionResult {
    if (!content) {
      return {
        hasSensitiveData: false,
        categories: [],
        redactedContent: "",
        matchedRules: [],
        severity: "CLEAN",
        riskDescription: "Empty or null payload inspected.",
      };
    }

    let redacted = content;
    const categories: DLPInspectionResult["categories"] = [];
    const matchedRules: string[] = [];
    let isCritical = false;

    // A. Payment Card & CVV Scan
    const potentialCards = content.match(PAYMENT_PATTERNS.cardFormatted) || [];
    for (const cardCandidate of potentialCards) {
      const cleanDigits = cardCandidate.replace(/\D/g, "");
      if (isValidLuhn(cleanDigits)) {
        categories.push("PAYMENT_CARD");
        matchedRules.push(`LUHN_VALIDATED_CARD_${cleanDigits.slice(-4)}`);
        isCritical = true;
        
        // Redact to ••••-••••-••••-1234
        const masked = `••••-••••-••••-${cleanDigits.slice(-4)}`;
        redacted = redacted.replace(cardCandidate, masked);
      }
    }

    // Redact CVV
    if (PAYMENT_PATTERNS.cvv.test(content)) {
      categories.push("CVV");
      matchedRules.push("CVV_SECURITY_CODE");
      isCritical = true;
      redacted = redacted.replace(PAYMENT_PATTERNS.cvv, "CVV: •••");
    }

    // Redact UPI IDs
    if (PAYMENT_PATTERNS.upiId.test(content)) {
      categories.push("UPI_ID");
      matchedRules.push("UPI_PAYMENT_VPA");
      redacted = redacted.replace(PAYMENT_PATTERNS.upiId, "[REDACTED_UPI_ID]");
    }

    // B. Secret & API Key Scan
    for (const [name, regex] of Object.entries(SECRET_PATTERNS)) {
      if (regex.test(content)) {
        categories.push("API_KEY");
        matchedRules.push(`SECRET_${name.toUpperCase()}`);
        isCritical = true;
        redacted = redacted.replace(regex, `[REDACTED_${name.toUpperCase()}]`);
      }
    }

    // C. Prompt Injection Traps
    for (const injPattern of PROMPT_INJECTION_PATTERNS) {
      if (injPattern.test(content)) {
        categories.push("PROMPT_INJECTION");
        matchedRules.push(`PROMPT_INJECTION_DETECTED: ${injPattern.source.slice(0, 30)}`);
        isCritical = true;
      }
    }

    // D. Proprietary Source Code Exfiltration Scan
    if (context === "outbound_network" || context === "clipboard_export") {
      for (const codePattern of CODE_EXFILTRATION_PATTERNS) {
        if (codePattern.test(content)) {
          categories.push("SOURCE_CODE_LEAK");
          matchedRules.push(`PROPRIETARY_CODE_EXFILTRATION: ${codePattern.source}`);
          isCritical = true;
          redacted = "[BLOCKED: Proprietary ARGUS Source Code Protected by Code Fortress]";
        }
      }
    }

    const hasSensitiveData = categories.length > 0;
    const severity = isCritical ? "CRITICAL" : hasSensitiveData ? "HIGH" : "CLEAN";

    return {
      hasSensitiveData,
      categories: Array.from(new Set(categories)),
      redactedContent: redacted,
      matchedRules,
      severity,
      riskDescription: hasSensitiveData
        ? `DLP Shield intercepted ${categories.length} sensitive patterns (${matchedRules.join(", ")})`
        : "Payload clean. Zero sensitive data detected.",
    };
  }

  /**
   * Redact sensitive payment and secret information prior to storage or telemetry
   */
  public static sanitizeForTelemetry(text: string): string {
    const res = this.inspectPayload(text, "telemetry");
    return res.redactedContent;
  }
}
