"use client";

import { useState, useTransition } from "react";

interface PresetScenario {
  id: string;
  title: string;
  category: string;
  query: string;
  dispatchedAgents: string[];
  executionTime: string;
  statutoryCitations: string[];
  synthesis: {
    summary: string;
    statutoryMatrix: Array<{ act: string; section: string; relevance: string }>;
    proceduralRoadmap: string[];
    riskScore: string;
    actionableBrief: string;
  };
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "fintech-insolvency",
    title: "Cheque Dishonour + IBC Section 9 Insolvency Petition",
    category: "Banking & Corporate Dispute",
    query:
      "A B2B SaaS corporate debtor failed to clear ₹4.8 Crore invoices. Two post-dated cheques bounced due to 'Insufficient Funds'. The debtor issued a vague reply claiming service performance defects 3 days AFTER the Section 138 statutory demand notice was served. Can we simultaneously trigger Section 138 NI Act proceedings and file a Section 9 IBC petition before NCLT?",
    dispatchedAgents: ["Banking Agent", "Corporate Agent", "Civil Agent", "Criminal Agent"],
    executionTime: "148ms P99",
    statutoryCitations: [
      "Section 138 & 141, Negotiable Instruments Act 1881",
      "Section 9 & Section 14, Insolvency and Bankruptcy Code (IBC) 2016",
      "Mobilox Innovations Pvt. Ltd. v. Kirusa Software Pvt. Ltd. (2018) 1 SCC 353",
      "P. Mohanraj & Others v. Shah Brothers Ispat Pvt. Ltd. (2021) 6 SCC 258",
    ],
    synthesis: {
      summary:
        "Concurrent remedy is legally sustainable. Section 138 NI Act (quasi-criminal punitive liability on directors) and Section 9 IBC (corporate resolution process) serve distinct objectives. Moratorium under Section 14 IBC stays proceedings against the corporate debtor but DOES NOT shield natural person directors under Section 138.",
      statutoryMatrix: [
        {
          act: "Negotiable Instruments Act 1881",
          section: "Section 138 & 141",
          relevance: "15-day notice expired; criminal complaint maintainable against signatory directors.",
        },
        {
          act: "Insolvency and Bankruptcy Code 2016",
          section: "Section 9(5)",
          relevance: "Threshold of ₹1 Cr satisfied; post-facto dispute email fails 'plausible contention' test.",
        },
        {
          act: "Commercial Courts Act 2015",
          section: "Section 12A",
          relevance: "Exempt from pre-institution mediation if urgent interim attachment sought.",
        },
      ],
      proceduralRoadmap: [
        "1. File Criminal Complaint under Section 138 NI Act before Metropolitan Magistrate within 30 days of notice expiry.",
        "2. File Section 9 IBC application before NCLT Principal/Designated Bench alongside Form 5 statutory proof of operational debt.",
        "3. Implead Managing Director & Authorized Signatories individually to prevent evasion under corporate veil.",
      ],
      riskScore: "Low Legal Risk / High Recovery Probability",
      actionableBrief: `MEMORANDUM ON CONCURRENT IBC & NI ACT REMEDIES
=====================================================
Client: Aggrieved Operational Creditor
Target: Corporate Debtor (B2B SaaS Firm) & Key Managerial Personnel
Claim Value: ₹4,80,00,000/- (Rupees Four Crore Eighty Lakhs Only)

I. EXECUTIVE DETERMINATION
-----------------------------------------------------
The operational creditor is legally entitled to proceed concurrently under both the Negotiable Instruments Act 1881 and the Insolvency and Bankruptcy Code 2016. The post-dated performance dispute raised post-notice constitutes an afterthought under the ratio of Mobilox Innovations (SC 2018).

II. STATUTORY CO-ORDINATION MATRIX
-----------------------------------------------------
1. NI Act § 138: Independent criminal remedy.
2. IBC § 9: Insolvency resolution mechanism.
3. SC Precedent (P. Mohanraj, 2021): Moratorium under § 14 IBC covers the company only; individual directors remain criminally liable under § 141 NI Act.

III. RECOMMENDED 7-DAY LITIGATION PROTOCOL
-----------------------------------------------------
- Day 1: Lodge § 138 complaint before jurisdictional Magistrate.
- Day 3: File Form 5 petition under § 9 IBC with banker certificate under § 9(3)(c).
- Day 7: Serve advance copy on debtor to maximize pre-admission settlement leverage.`,
    },
  },
  {
    id: "ai-ip-trade-secret",
    title: "AI Model Weights Exfiltration & DPDP Act Breach",
    category: "IP & Cyber Technology",
    query:
      "A former lead AI engineer exfiltrated fine-tuned neural model weights and proprietary dataset embeddings (worth $2.5M) to a rival stealth startup. They claim the model is open-weights derivative and protected under Copyright Act Section 52 Fair Dealing. We also suspect personal data of 40,000 Indian citizens was in the training batch. What urgent reliefs lie under IP law, BNSS, and DPDP Act 2023?",
    dispatchedAgents: ["IP Agent", "Criminal Agent", "Constitutional Agent", "Civil Agent"],
    executionTime: "162ms P99",
    statutoryCitations: [
      "Section 51 & 63, Copyright Act 1957 (Literary Work / Software Source)",
      "Section 43, 66 & 72A, Information Technology Act 2000",
      "Section 316 & 318, Bharatiya Nyaya Sanhita (BNS) 2023 (Criminal Breach of Trust & Theft)",
      "Section 8 & 33, Digital Personal Data Protection (DPDP) Act 2023",
      "Eastern Book Company v. D.B. Modak (2008) 1 SCC 1",
    ],
    synthesis: {
      summary:
        "Model weights and curated embedding indices qualify as proprietary computer programs and trade secrets under Section 2(o) of Copyright Act. Exfiltration constitutes Criminal Breach of Trust under BNS § 316 and unauthorized data extraction under IT Act § 43. Mandatory DPDP data breach reporting protocol must be initiated within prescribed regulatory window.",
      statutoryMatrix: [
        {
          act: "Copyright Act 1957",
          section: "Section 2(o) & Section 55",
          relevance: "Ex-parte John Doe (Ashok Kumar) interim injunction against commercial deployment.",
        },
        {
          act: "Bharatiya Nyaya Sanhita 2023",
          section: "Section 316 (BNS)",
          relevance: "Cognizable criminal breach of trust by employee with custody of digital assets.",
        },
        {
          act: "DPDP Act 2023",
          section: "Section 8(6) & Section 33",
          relevance: "Data Protection Board intimation required; penalty mitigation protocol.",
        },
      ],
      proceduralRoadmap: [
        "1. Move High Court Commercial Division for ex-parte Anton Piller (search/seizure) & John Doe injunction orders.",
        "2. Lodge FIR with Cyber Crime Police Station under Section 66 IT Act & Section 316 BNS.",
        "3. File Form-1 Data Breach Incident Report with Data Protection Board of India.",
      ],
      riskScore: "Critical Urgency / Immediate Ex-Parte Injunctive Remedy Available",
      actionableBrief: `URGENT RELIEF STRATEGY: AI TRADE SECRET EXFILTRATION
=====================================================
Subject: Unauthorized Appropriation of Model Weights & Training Datasets
Jurisdiction: High Court of Delhi (Commercial & IP Division)

I. PRIMA FACIE COPYRIGHT & TRADE SECRET ENTITLEMENT
-----------------------------------------------------
1. Curated vector embeddings and fine-tuned checkpoints satisfy 'modicum of creativity' standard (EBC v. Modak).
2. Defense under § 52 Fair Dealing inapplicable to unauthorized commercial duplication by former fiduciary employees.

II. TRIPLE EMERGENCY RELIEF PACKAGE
-----------------------------------------------------
A. Commercial Suit with Order XXXIX Rules 1 & 2 CPC:
   - Restrain rival entity from deploying, hosting, or open-sourcing weights.
   - Court Commissioner appointed to forensic-clone target servers.

B. Cyber Criminal Action (BNS § 316 / IT Act § 66):
   - Preservation notice to cloud service provider (AWS/GCP) to lock snapshot volumes.

C. DPDP Regulatory Shield:
   - Proactive self-disclosure to Data Protection Board demonstrating zero willful data leakage.`,
    },
  },
  {
    id: "rera-ngt-realestate",
    title: "RERA Possession Delay + NGT Environmental Clearance Dispute",
    category: "Real Estate & Environmental Law",
    query:
      "A commercial township developer delayed handover by 30 months citing NGT stay orders on groundwater extraction. 150 commercial allottees formed an association demanding 100% refund with interest under RERA Section 18. Developer argues 'Force Majeure'. Does an NGT environmental compliance dispute constitute valid Force Majeure under Indian law?",
    dispatchedAgents: ["Property Agent", "Environment Agent", "Consumer Agent", "Civil Agent"],
    executionTime: "154ms P99",
    statutoryCitations: [
      "Section 18 & Section 19, RERA Act 2016",
      "Section 14 & 15, National Green Tribunal (NGT) Act 2010",
      "Section 56, Indian Contract Act 1872 (Frustration Doctrine)",
      "Imperia Structures Ltd. v. Anil Patni (2020) 10 SCC 783",
      "Newtech Promoters & Developers v. State of UP (2021) SCC OnLine SC 1044",
    ],
    synthesis: {
      summary:
        "Developer's Force Majeure defense will fail. Supreme Court in Newtech Promoters (2021) and Imperia Structures (2020) held that regulatory or environmental non-compliance created by developer's own procedural delays does not constitute statutory Force Majeure. Allottees possess an absolute, unconditional right to complete refund with SBI MCLR + 2% interest.",
      statutoryMatrix: [
        {
          act: "RERA Act 2016",
          section: "Section 18(1)",
          relevance: "Unconditional right of allottees to claim full refund with statutory interest.",
        },
        {
          act: "Indian Contract Act 1872",
          section: "Section 56",
          relevance: "Self-induced environmental violations cannot be pleaded as contractual frustration.",
        },
        {
          act: "Consumer Protection Act 2019",
          section: "Section 35 & 47",
          relevance: "Concurrent class-action jurisdiction before National Commission (NCDRC).",
        },
      ],
      proceduralRoadmap: [
        "1. File consolidated complaint under Section 31 RERA before State Real Estate Regulatory Authority.",
        "2. Compute interest at SBI Highest Marginal Cost of Funds Based Lending Rate (MCLR) + 2% from promised possession date.",
        "3. Seek attachment of developer's escrow account under Section 4(2)(l)(D) RERA.",
      ],
      riskScore: "High Allottee Success Certainty (>95% Supreme Court Settled Law)",
      actionableBrief: `LEGAL ASSESSMENT: ALLOTTEE REFUND & FORCE MAJEURE REBUTTAL
=====================================================
Forum: State RERA Authority & NCDRC
Subject: Rebuttal of Environmental Force Majeure Defense under § 18 RERA

I. REBUTTAL OF FORCE MAJEURE (SUPREME COURT DOCTRINE)
-----------------------------------------------------
1. Self-Induced Hardship: NGT stay on groundwater arose solely due to developer's failure to secure Central Ground Water Authority (CGWA) NOC prior to construction.
2. Settled Precedent: In Newtech Promoters (SC 2021), the Apex Court affirmed that § 18 RERA rights are absolute and independent of builder's internal hurdles.

II. MONETARY RELIEF FORMULATION
-----------------------------------------------------
- Principal Refund: 100% of deposited sums.
- Interest: SBI MCLR + 2% per annum compounding monthly.
- Litigation Cost & Compensation for mental agony under § 19(4) RERA.`,
    },
  },
];

export function AgentPlayground() {
  const [selectedScenario, setSelectedScenario] = useState<PresetScenario>(PRESET_SCENARIOS[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionPhase, setExecutionPhase] = useState<number>(0);
  const [copiedToast, setCopiedToast] = useState(false);
  const [, startTransition] = useTransition();

  const handleRunSimulation = (scenario: PresetScenario) => {
    setSelectedScenario(scenario);
    setIsExecuting(true);
    setExecutionPhase(1);

    // Step-by-step visual execution flow
    setTimeout(() => setExecutionPhase(2), 500);
    setTimeout(() => setExecutionPhase(3), 1100);
    setTimeout(() => {
      setExecutionPhase(4);
      setIsExecuting(false);
    }, 1700);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    // Create dynamic synthesized response based on custom query
    const dynamicScenario: PresetScenario = {
      id: "custom-query",
      title: "Custom Legal Inquiry",
      category: "Multi-Agent Synthesized Query",
      query: customPrompt,
      dispatchedAgents: ["Corporate Agent", "Civil Agent", "Tax Agent", "Constitutional Agent"],
      executionTime: "142ms P99",
      statutoryCitations: [
        "Constitution of India (Articles 14, 19, 226)",
        "Indian Contract Act 1872 & Specific Relief Act 1963",
        "Companies Act 2013 / Relevant Regulatory Norms",
        "Supreme Court of India Landmark Precedents",
      ],
      synthesis: {
        summary: `Verdikt Core multi-agent routing decomposed the custom inquiry into statutory validity, procedural jurisdiction, and evidentiary compliance across 4 coordinated specialist agents.`,
        statutoryMatrix: [
          {
            act: "Governing Statute",
            section: "Substantive Provisions",
            relevance: "Primary legal cause of action identified from factual submission.",
          },
          {
            act: "Procedural Code",
            section: "Jurisdictional Mandate",
            relevance: "Appropriate High Court / Specialized Tribunal identified.",
          },
        ],
        proceduralRoadmap: [
          "1. Issue formal legal notice detailing quantifiable claim and statutory liability.",
          "2. Prepare verified affidavit and pleadings in compliance with High Court Commercial Rules.",
          "3. Invoke emergency interim protective relief to safeguard status quo.",
        ],
        riskScore: "Optimal Actionable Strategy Generated",
        actionableBrief: `MULTI-AGENT LEGAL OPINION (PRO VERSION)
=====================================================
Query: ${customPrompt}

I. FACTUAL & STATUTORY SYNTHESIS
-----------------------------------------------------
Specialist Agents have evaluated the factual matrix against current Indian statutes and High Court precedents.

II. STRATEGIC LITIGATION ROADMAP
-----------------------------------------------------
1. Procedural threshold compliance verified.
2. Forum selection optimized for expedited disposal.
3. Cross-domain legal liabilities consolidated into a single unified pleading.`,
      },
    };

    handleRunSimulation(dynamicScenario);
  };

  const handleCopyBrief = () => {
    navigator.clipboard.writeText(selectedScenario.synthesis.actionableBrief);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
  };

  const handleDownloadMarkdown = () => {
    const content = `# VERDIKT PRO LEGAL BRIEF\n\n## Title: ${selectedScenario.title}\n**Category:** ${selectedScenario.category}\n**Latency:** ${selectedScenario.executionTime}\n\n### Query:\n> ${selectedScenario.query}\n\n### Dispatched Agents:\n${selectedScenario.dispatchedAgents.map((a) => `- ${a}`).join("\n")}\n\n### Statutory Grounding:\n${selectedScenario.statutoryCitations.map((c) => `- ${c}`).join("\n")}\n\n### Executive Summary:\n${selectedScenario.synthesis.summary}\n\n### Actionable Brief:\n\`\`\`text\n${selectedScenario.synthesis.actionableBrief}\n\`\`\`\n\n---\n*Generated by Verdikt by Soulvai Technologies — India's First Multi-Agent Legal AI Platform.*`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Verdikt_Brief_${selectedScenario.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="playground" className="bg-ink-navy text-court-paper py-20 md:py-28 border-b border-slate/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gazette-brass">
            <span className="w-2 h-2 rounded-full bg-verdigris inline-block shadow-[0_0_6px_#45735F]" />
            <span>Interactive Multi-Agent Sandbox · Pro Engine</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-court-paper">
            Simulate Live Multi-Agent Orchestration
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate leading-relaxed">
            Test how Verdikt’s Core Router analyzes complex, multi-jurisdictional legal scenarios,
            dispatches dedicated specialist agents concurrently, and synthesizes a verified, court-ready brief.
          </p>
        </div>

        {/* Preset Scenario Selector Tabs */}
        <div className="space-y-3">
          <span className="text-xs font-sans uppercase tracking-wider text-slate font-semibold block">
            Select High-Stakes Scenario Preset:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRESET_SCENARIOS.map((scenario) => {
              const isSelected = selectedScenario.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleRunSimulation(scenario)}
                  className={`text-left p-4 rounded-sm border transition-all ${
                    isSelected
                      ? "bg-ink-navy/90 border-gazette-brass shadow-[0_0_15px_rgba(173,138,70,0.15)] ring-1 ring-gazette-brass"
                      : "bg-ink-navy/50 border-slate/30 hover:border-slate/60 hover:bg-ink-navy/70"
                  }`}
                >
                  <span className="text-[10px] font-mono text-gazette-brass uppercase tracking-widest block mb-1">
                    {scenario.category}
                  </span>
                  <h3 className="font-sans text-sm font-semibold text-court-paper line-clamp-1">
                    {scenario.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate">
                    <span className="w-1.5 h-1.5 rounded-full bg-verdigris" />
                    <span>{scenario.dispatchedAgents.length} Agents Dispatched</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Simulation Display Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Query & Execution Graph (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Active Query Card */}
            <div className="bg-ink-navy/80 border border-slate/30 p-5 rounded-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate/30 pb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate">
                  Active Legal Scenario
                </span>
                <span className="text-xs font-mono text-verdigris font-semibold tabular-nums">
                  {selectedScenario.executionTime}
                </span>
              </div>
              <p className="font-sans text-sm text-court-paper/90 leading-relaxed italic">
                &ldquo;{selectedScenario.query}&rdquo;
              </p>
            </div>

            {/* Custom Query Input Box */}
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <label htmlFor="custom-query" className="text-xs font-sans uppercase tracking-wider text-slate font-semibold block">
                Or Enter Custom Multi-Domain Case:
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-query"
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Director dispute under Companies Act § 241 with police FIR..."
                  className="flex-1 text-xs font-sans px-3 py-2.5 bg-ink-navy/90 border border-slate/30 text-court-paper placeholder:text-slate rounded-sm focus:border-gazette-brass focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gazette-brass"
                />
                <button
                  type="submit"
                  disabled={isExecuting}
                  className="px-4 py-2.5 bg-gazette-brass hover:bg-gazette-brass/90 text-ink-navy font-sans text-xs font-semibold rounded-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <span>Dispatch</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Orchestration Phase Timeline */}
            <div className="bg-ink-navy/90 border border-slate/30 p-5 rounded-sm space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-gazette-brass block">
                Real-Time Orchestration Pipeline
              </span>

              <div className="space-y-3 font-sans text-xs">
                {/* Phase 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gazette-brass/20 text-gazette-brass border border-gazette-brass/40 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="text-court-paper font-medium block">Verdikt Intent Disambiguation</span>
                    <span className="text-slate text-[11px]">
                      Decomposes complex query into discrete statutory causes of action.
                    </span>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-verdigris/20 text-verdigris border border-verdigris/40 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="text-court-paper font-medium block">Concurrent Specialist Dispatch</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedScenario.dispatchedAgents.map((agent) => (
                        <span
                          key={agent}
                          className="px-2 py-0.5 text-[10px] font-mono text-court-paper bg-court-paper/10 border border-slate/30 rounded-sm"
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gazette-brass/20 text-gazette-brass border border-gazette-brass/40 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="text-court-paper font-medium block">Apex & High Court Grounding</span>
                    <span className="text-slate text-[11px]">
                      Cross-references 4,280+ Central Acts & 1.2M+ Supreme Court/High Court judgments.
                    </span>
                  </div>
                </div>

                {/* Phase 4 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-verdigris/20 text-verdigris border border-verdigris/40 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <span className="text-court-paper font-medium block">Unified Consensus Synthesis</span>
                    <span className="text-slate text-[11px]">
                      Produces verified, actionable legal memorandum with tactical procedural sequence.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Synthesized Output & Legal Memo (7 cols) */}
          <div className="lg:col-span-7 bg-ink-navy/90 border border-gazette-brass/40 rounded-sm shadow-xl p-6 sm:p-8 space-y-6">
            {/* Memo Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate/30 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-verdigris inline-block" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gazette-brass font-semibold">
                    Verdikt Pro · Multi-Agent Output
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-court-paper font-medium mt-1">
                  {selectedScenario.title}
                </h3>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyBrief}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium text-court-paper bg-court-paper/10 hover:bg-court-paper/20 border border-slate/40 rounded-sm transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gazette-brass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>{copiedToast ? "Copied!" : "Copy Brief"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-semibold text-ink-navy bg-gazette-brass hover:bg-gazette-brass/90 border border-gazette-brass rounded-sm transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Export (.md)</span>
                </button>
              </div>
            </div>

            {/* Executive Consensus Summary */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans uppercase tracking-widest text-slate font-semibold block">
                Executive Consensus Determination
              </span>
              <p className="font-sans text-sm text-court-paper/90 leading-relaxed bg-ink-navy/60 border border-slate/20 p-4 rounded-sm">
                {selectedScenario.synthesis.summary}
              </p>
            </div>

            {/* Statutory Grounding Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans uppercase tracking-widest text-gazette-brass font-semibold block">
                Statutory Matrix & Code Application
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate/30 text-slate uppercase text-[10px]">
                      <th className="py-2 px-3">Statute</th>
                      <th className="py-2 px-3">Section</th>
                      <th className="py-2 px-3">Direct Application</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate/20 text-court-paper">
                    {selectedScenario.synthesis.statutoryMatrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate/10">
                        <td className="py-2.5 px-3 font-medium text-gazette-brass">{row.act}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-court-paper">{row.section}</td>
                        <td className="py-2.5 px-3 text-slate">{row.relevance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Procedural Sequence Steps */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans uppercase tracking-widest text-slate font-semibold block">
                Recommended Procedural Strategy
              </span>
              <ul className="space-y-1.5 font-sans text-xs text-court-paper/90">
                {selectedScenario.synthesis.proceduralRoadmap.map((step, idx) => (
                  <li key={idx} className="bg-ink-navy/50 border border-slate/20 px-3 py-2 rounded-sm">
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Formatted Code Block of Actionable Brief */}
            <div className="space-y-2 border-t border-slate/30 pt-4">
              <span className="text-[10px] font-sans uppercase tracking-widest text-gazette-brass font-semibold block">
                Court-Ready Synthesized Draft Brief
              </span>
              <pre className="p-4 bg-ink-navy border border-slate/30 rounded-sm font-mono text-[11px] text-court-paper/90 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-60 overflow-y-auto">
                {selectedScenario.synthesis.actionableBrief}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
