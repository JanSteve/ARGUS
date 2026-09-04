export interface LegalAgent {
  name: string;
  domain: string;
  group: "Commercial & Regulatory Law" | "Public & Procedural Law" | "Individual & Social Law";
  desc: string;
  tags: string[];
}

export const agentGroups = [
  "Commercial & Regulatory Law",
  "Public & Procedural Law",
  "Individual & Social Law",
] as const;

export const agents: LegalAgent[] = [
  // Commercial & Regulatory Law
  {
    name: "Corporate Agent",
    domain: "Corporate & Company Law",
    group: "Commercial & Regulatory Law",
    desc: "Companies Act 2013, SEBI, MCA filings, M&A, corporate governance & compliance.",
    tags: ["Companies Act", "SEBI", "MCA"],
  },
  {
    name: "IP Agent",
    domain: "Intellectual Property",
    group: "Commercial & Regulatory Law",
    desc: "Patents Act, Trade Marks Act, Copyright Act, GI tags & IP enforcement at High Courts.",
    tags: ["Patents", "Trademarks", "Copyright"],
  },
  {
    name: "Tax Agent",
    domain: "Tax Law — GST & Direct",
    group: "Commercial & Regulatory Law",
    desc: "Income Tax Act, GST laws, advance rulings & appellate procedures before ITAT & GSTAT.",
    tags: ["Income Tax", "GST", "ITAT"],
  },
  {
    name: "Banking Agent",
    domain: "Banking & Finance Law",
    group: "Commercial & Regulatory Law",
    desc: "RBI regulations, SARFAESI Act, IBC 2016, debt recovery & NBFC compliance.",
    tags: ["IBC 2016", "SARFAESI", "RBI"],
  },

  // Public & Procedural Law
  {
    name: "Civil Agent",
    domain: "Civil Law & Procedure",
    group: "Public & Procedural Law",
    desc: "CPC 1908, tort law, contract disputes, injunctions & civil procedures across all High Courts.",
    tags: ["CPC 1908", "Contracts", "Torts"],
  },
  {
    name: "Criminal Agent",
    domain: "Criminal Law & BNSS",
    group: "Public & Procedural Law",
    desc: "BNSS 2023, BNS 2023, BSA, bail jurisprudence & criminal trial procedures.",
    tags: ["BNSS 2023", "BNS", "IPC"],
  },
  {
    name: "Constitutional Agent",
    domain: "Constitutional Law",
    group: "Public & Procedural Law",
    desc: "Constitution of India, fundamental rights, DPSPs, PIL jurisprudence & landmark SC judgments.",
    tags: ["Constitution", "PIL", "FRs"],
  },

  // Individual & Social Law
  {
    name: "Family Agent",
    domain: "Family & Matrimonial Law",
    group: "Individual & Social Law",
    desc: "Hindu Marriage Act, Special Marriage Act, divorce, custody, maintenance & succession.",
    tags: ["HMA", "Custody", "Succession"],
  },
  {
    name: "Labour Agent",
    domain: "Labour & Employment Law",
    group: "Individual & Social Law",
    desc: "Labour Codes 2020, Industrial Disputes Act, PF/ESI, wrongful termination & employment contracts.",
    tags: ["Labour Codes", "IDA", "PF/ESI"],
  },
  {
    name: "Property Agent",
    domain: "Real Estate & Property",
    group: "Individual & Social Law",
    desc: "Transfer of Property Act, RERA 2016, stamp duty, land acquisition & tenancy laws.",
    tags: ["RERA", "TPA", "Registration"],
  },
  {
    name: "Consumer Agent",
    domain: "Consumer Protection",
    group: "Individual & Social Law",
    desc: "Consumer Protection Act 2019, e-commerce rules, product liability & NCDRC procedures.",
    tags: ["CPA 2019", "NCDRC", "E-commerce"],
  },
  {
    name: "Environment Agent",
    domain: "Environmental Law",
    group: "Individual & Social Law",
    desc: "Environment Protection Act, NGT jurisdiction, forest laws & pollution control regulations.",
    tags: ["EPA", "NGT", "Forest Act"],
  },
];
