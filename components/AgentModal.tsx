"use client";

import { useEffect } from "react";
import { LegalAgent } from "@/content/agents";

interface AgentModalProps {
  agent: LegalAgent | null;
  onClose: () => void;
  onTestInPlayground?: (agentName: string) => void;
}

const agentDeepDiveDetails: Record<
  string,
  {
    jurisdiction: string;
    benches: string;
    systemRole: string;
    benchmarkAccuracy: string;
    sampleQuery: string;
    sampleOutput: string;
  }
> = {
  "Corporate Agent": {
    jurisdiction: "NCLT, NCLAT, High Courts, Supreme Court of India",
    benches: "NCLT Principal Bench (New Delhi), NCLT Mumbai, NCLAT New Delhi",
    systemRole:
      "Expert corporate counsel specializing in Companies Act 2013, SEBI (LODR) Regulations, M&A due diligence, and director fiduciary liabilities.",
    benchmarkAccuracy: "99.4% citation recall on 10+ years of NCLAT/SC corporate orders",
    sampleQuery:
      "Draft a board resolution and disclosure under Regulation 30 SEBI LODR for an unlisted subsidiary divestment involving interested director transactions under Section 188 Companies Act.",
    sampleOutput:
      "Statutory Reference: Section 188(1) Companies Act 2013 read with Rule 15 of Companies (Meetings of Board and its Powers) Rules 2014.\n\nResolution Summary:\n1. Prior approval of Audit Committee obtained pursuant to Section 177(4)(iv).\n2. Disinterested board majority voting verified; interested directors recused.\n3. Materiality threshold calculated against consolidated net worth (<10% threshold check passed).\n4. Regulation 30 SEBI LODR Schedule III Part A disclosure drafted with 24-hour statutory timeline.",
  },
  "IP Agent": {
    jurisdiction: "High Court IP Divisions (Delhi, Madras, Bombay), CGPDTM, IPAB Legacy",
    benches: "Delhi High Court IPD, Bombay High Court Commercial Division",
    systemRole:
      "Patent attorney and trademark litigator trained on Patents Act 1970, Trade Marks Act 1999, Copyright Act 1957, and standard essential patent (SEP) jurisprudence.",
    benchmarkAccuracy: "98.9% accuracy on Section 3(k) patentability exclusions and passing-off standards",
    sampleQuery:
      "Formulate defense strategy against Section 3(k) computer-related invention rejection for an AI inference compiler with hardware acceleration.",
    sampleOutput:
      "Statutory Grounding: Section 3(k) Patents Act 1970 read with 2017 CRI Guidelines & Delhi High Court ruling in Ferid Allani v. Union of India (2019).\n\nKey Defense Arguments:\n1. Technical Effect Established: The method produces a concrete hardware-level improvement (cache hit efficiency + GPU memory compression).\n2. Beyond 'Algorithm Per Se': Demonstrates transformative technical contribution beyond abstract mathematical steps.\n3. Claim Refactoring: Reposition independent claims to tie computational pipeline to hardware memory controllers.",
  },
  "Tax Agent": {
    jurisdiction: "ITAT, GSTAT, High Courts, Supreme Court",
    benches: "ITAT Mumbai & Delhi Benches, High Court Tax Divisions",
    systemRole:
      "Direct and indirect taxation counsel mastering Income Tax Act 1961, CGST/SGST Acts 2017, transfer pricing rules, and search/seizure assessments under Section 132.",
    benchmarkAccuracy: "99.1% verification rate across CBDT/CBIC circulars and GST notifications",
    sampleQuery:
      "Challenge a Section 148A show-cause notice alleging escaped assessment based on automated risk management insight without providing underlying material.",
    sampleOutput:
      "Statutory Grounding: Section 148A(b) of Income Tax Act 1961 read with SC landmark in Union of India v. Ashish Agarwal (2022).\n\nActionable Grounds:\n1. Non-furnishing of foundational material relied upon by the Assessing Officer constitutes violation of natural justice.\n2. Independent application of mind lacking: Mechanical reliance on automated portal flags without subjective satisfaction.\n3. Draft Writ Petition under Article 226 for quashing notice and directing supply of unredacted portal logs.",
  },
  "Banking Agent": {
    jurisdiction: "DRT, DRAT, NCLT, Supreme Court of India",
    benches: "DRT-I/II/III Benches, NCLT Principal Bench",
    systemRole:
      "Banking litigator and insolvency specialist on Insolvency and Bankruptcy Code (IBC) 2016, SARFAESI Act 2002, and RBI Master Directions.",
    benchmarkAccuracy: "99.6% tracking on Section 7/9 IBC admission standards and moratorium jurisprudence",
    sampleQuery:
      "Defend a corporate debtor against Section 9 IBC petition where genuine pre-existing disputes were raised prior to demand notice.",
    sampleOutput:
      "Statutory Grounding: Section 9(5)(ii)(d) IBC 2016 read with SC landmark Mobilox Innovations Pvt. Ltd. v. Kirusa Software Pvt. Ltd. (2018).\n\nDefense Blueprint:\n1. Establish 'Plausible Contention': Collate pre-demand email correspondence demonstrating dispute over service deliverables.\n2. Non-applicability of CIRP: Show that IBC cannot be leveraged as a coercive debt recovery mechanism for disputed claims.",
  },
  "Civil Agent": {
    jurisdiction: "District Courts, High Courts, Supreme Court",
    benches: "Original & Appellate Benches Nationwide",
    systemRole:
      "Civil procedural master versed in Code of Civil Procedure (CPC) 1908, Specific Relief Act 1963, Indian Contract Act 1872, and Law of Injunctions.",
    benchmarkAccuracy: "98.7% procedural accuracy across Order XXXIX injunctions & Order VII Rule 11 rejections",
    sampleQuery:
      "Draft an interim injunction application under Order XXXIX Rules 1 & 2 CPC in a commercial contract breach involving irreparable business damage.",
    sampleOutput:
      "Statutory Grounding: Order XXXIX Rules 1 & 2 CPC read with Section 41 Specific Relief Act 1963.\n\nTriple-Test Argumentation:\n1. Prima Facie Case: Clear, unambiguous breach of non-compete/exclusivity clause in executed agreement.\n2. Balance of Convenience: Tilt heavily towards petitioner as respondent's unauthorized conduct creates irreversible market confusion.\n3. Irreparable Injury: Monetary compensation incapable of remedying structural market share destruction.",
  },
  "Criminal Agent": {
    jurisdiction: "Sessions Courts, High Courts, Supreme Court of India",
    benches: "Criminal Appellate & Roster Benches across all States",
    systemRole:
      "Criminal defense and trial strategist trained on the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Bharatiya Nyaya Sanhita (BNS) 2023, and Bharatiya Sakshya Adhiniyam (BSA) 2023.",
    benchmarkAccuracy: "99.2% cross-mapping accuracy between legacy IPC/CrPC sections and new BNS/BNSS codes",
    sampleQuery:
      "Prepare anticipatory bail arguments under Section 482 BNSS 2023 for alleged cyber fraud without prior Section 35 notice.",
    sampleOutput:
      "Statutory Grounding: Section 482 BNSS 2023 (Anticipatory Bail) read with Section 35(3) BNSS mandatory notice requirements & Arnesh Kumar guidelines.\n\nKey Bail Arguments:\n1. Procedural Default: Investigating officer bypassed mandatory preliminary inquiry and notice to appear for offenses punishable under 7 years.\n2. Deep Community Ties: Applicant has permanent residence, zero flight risk, and fully undertakes to join investigation.\n3. Documented Digital Audit Trail: Submit server access logs refuting unauthorized backend access.",
  },
  "Constitutional Agent": {
    jurisdiction: "High Courts (Article 226/227), Supreme Court of India (Article 32)",
    benches: "Constitutional Benches & Writ Benches",
    systemRole:
      "Constitutional litigator specializing in fundamental rights (Articles 14, 19, 21), administrative law, judicial review, and public interest litigation (PIL).",
    benchmarkAccuracy: "99.8% precision on Constitution Bench ratio decidendi and writ doctrines",
    sampleQuery:
      "Draft grounds for Article 226 Writ of Mandamus against arbitrary arbitrary license cancellation by municipal authority without hearing.",
    sampleOutput:
      "Statutory Grounding: Article 226 Constitution of India read with Article 14 (Anti-Arbitrariness Doctrine) & Menaka Gandhi audi alteram partem principle.\n\nCore Grounds:\n1. Violation of Natural Justice: Cancellation order passed unilaterally without issuing a prior show-cause notice.\n2. Proportionality Test: Extreme sanction of cancellation disproportionate when rectification was feasible.\n3. Legitimate Expectation: Substantial capital investment made pursuant to duly issued valid statutory license.",
  },
  "Family Agent": {
    jurisdiction: "Family Courts, High Courts, Supreme Court",
    benches: "Specialized Family Court Benches",
    systemRole:
      "Matrimonial and custody counsel trained on Hindu Marriage Act 1955, Special Marriage Act 1954, Guardians and Wards Act, and Domestic Violence Act 2005.",
    benchmarkAccuracy: "98.5% case synthesis on interim maintenance formulas under Rajnesh v. Neha",
    sampleQuery:
      "Compute interim maintenance application under Section 24 HMA in accordance with Supreme Court comprehensive income affidavit guidelines.",
    sampleOutput:
      "Statutory Grounding: Section 24 Hindu Marriage Act 1955 read with SC ruling in Rajnesh v. Neha (2020) & Aditi v. Jitesh (2023).\n\nStructured Formulation:\n1. Mandatory Disclosure: Standardized affidavit of assets, liabilities, lifestyle expenditure, and corporate shareholding filed.\n2. Quantified Claim: Balanced against standard of living enjoyed in matrimonial home.",
  },
  "Labour Agent": {
    jurisdiction: "Labour Courts, Industrial Tribunals, High Courts",
    benches: "Labour Appellate Benches, EPF/ESI Appellate Tribunals",
    systemRole:
      "Labour and industrial relations strategist mastering Labour Codes 2020, Industrial Disputes Act 1947, EPF Act, and POSH Act 2013.",
    benchmarkAccuracy: "98.8% compliance accuracy across four Labour Codes & legacy dispute rules",
    sampleQuery:
      "Draft retrenchment compliance protocol and notice under Industrial Disputes Act Section 25F with compensation calculation.",
    sampleOutput:
      "Statutory Grounding: Section 25F of Industrial Disputes Act 1947 & Code on Industrial Relations 2020.\n\nStep-by-Step Protocol:\n1. Statutory Notice: 1 month prior written notice detailing valid economic/business rationale.\n2. Compensation Computation: 15 days average pay for every completed year of continuous service.\n3. Government Intimation: Form P intimation dispatched to Labour Commissioner simultaneously.",
  },
  "Property Agent": {
    jurisdiction: "RERA Authorities, REAT, Civil Courts, High Courts",
    benches: "State RERA Benches, High Court Property Benches",
    systemRole:
      "Real estate and title litigator specializing in Real Estate (Regulation and Development) Act 2016 (RERA), Transfer of Property Act 1882, and Registration Act.",
    benchmarkAccuracy: "99.3% accuracy on RERA Section 18 delay compensation and title search protocols",
    sampleQuery:
      "Draft complaint before RERA Authority seeking full refund with interest for 24-month delay in apartment handover.",
    sampleOutput:
      "Statutory Grounding: Section 18(1) RERA 2016 read with Rule 16 of State RERA Rules & SC landmark in Imperia Structures.\n\nRelief Requested:\n1. Immediate refund of total consideration paid along with SBI Marginal Cost of Funds Based Lending Rate (MCLR) + 2% interest from due date of possession to actual date of payment.\n2. Compensation for mental agony and litigation expenses under Section 19(4).",
  },
  "Consumer Agent": {
    jurisdiction: "District Consumer Disputes Redressal Commission, SCDRC, NCDRC, Supreme Court",
    benches: "NCDRC New Delhi, State Commissions",
    systemRole:
      "Consumer rights advocate on Consumer Protection Act 2019, E-Commerce Rules 2020, unfair trade practices, and product liability claims.",
    benchmarkAccuracy: "99.0% verification of deficiency in service standards & statutory limitation periods",
    sampleQuery:
      "Draft a formal complaint against an e-commerce marketplace and manufacturer for defective battery explosion under CPA 2019 product liability.",
    sampleOutput:
      "Statutory Grounding: Chapter VI (Sections 82-87) of Consumer Protection Act 2019.\n\nLiability Apportionment:\n1. Product Manufacturer (Section 84): Strict liability for design defect and manufacturing flaw.\n2. Product Seller/Platform (Section 86): Liability for failure to verify certification standards and uncurated merchant listings.\n3. Claim: Full replacement value plus punitive medical damages and loss of livelihood compensation.",
  },
  "Environment Agent": {
    jurisdiction: "National Green Tribunal (NGT), High Courts, Supreme Court",
    benches: "NGT Principal Bench (New Delhi), Western Zone (Pune), Southern Zone (Chennai)",
    systemRole:
      "Environmental and sustainability litigator on Environment (Protection) Act 1986, NGT Act 2010, Forest Conservation Act, and EIA Notifications.",
    benchmarkAccuracy: "98.9% precision on Polluter Pays Principle and Precautionary Doctrine",
    sampleQuery:
      "Draft application before NGT Principal Bench against industrial effluent discharge contaminating groundwater reserves.",
    sampleOutput:
      "Statutory Grounding: Sections 14, 15 & 20 of National Green Tribunal Act 2010 read with Water (Prevention & Control of Pollution) Act 1974.\n\nKey Prayers:\n1. Immediate interim order halting industrial unit operations pending joint CPCB/SPCB inspection.\n2. Direction to deposit environmental restitution escrow fund based on Polluter Pays Principle.\n3. Mandate installation of continuous online effluent monitoring telemetry (OCEMS).",
  },
};

export function AgentModal({ agent, onClose, onTestInPlayground }: AgentModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (agent) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [agent, onClose]);

  if (!agent) return null;

  const details = agentDeepDiveDetails[agent.name] || {
    jurisdiction: "High Courts & Supreme Court of India",
    benches: "Original & Appellate Benches",
    systemRole: `Specialist agent dedicated to ${agent.domain}.`,
    benchmarkAccuracy: "99%+ statutory retrieval accuracy",
    sampleQuery: `Analyze legal compliance and court precedents under ${agent.tags.join(", ")}.`,
    sampleOutput: `Statutory analysis grounded in Indian statutes and High Court precedents for ${agent.domain}.`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-navy/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-ink-navy text-court-paper border border-gazette-brass/40 shadow-2xl rounded-sm p-6 sm:p-8 z-10 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-agent-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate/30 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-sm bg-verdigris inline-block shadow-[0_0_6px_#45735F]" />
              <span className="text-xs font-sans uppercase tracking-widest text-gazette-brass font-semibold">
                {agent.group}
              </span>
            </div>
            <h3 id="modal-agent-title" className="font-display text-2xl sm:text-3xl text-court-paper font-medium">
              {agent.name}
            </h3>
            <p className="font-sans text-sm text-slate">{agent.domain}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate hover:text-court-paper hover:bg-slate/10 rounded-sm transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Core Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-ink-navy/60 border border-slate/20 p-4 rounded-sm text-xs font-sans">
          <div className="space-y-1">
            <span className="text-slate uppercase tracking-wider text-[10px]">Primary Jurisdiction</span>
            <p className="text-court-paper font-medium">{details.jurisdiction}</p>
          </div>
          <div className="space-y-1">
            <span className="text-slate uppercase tracking-wider text-[10px]">Key Benches & Tribunals</span>
            <p className="text-court-paper font-medium">{details.benches}</p>
          </div>
          <div className="space-y-1 sm:col-span-2 border-t border-slate/20 pt-3">
            <span className="text-slate uppercase tracking-wider text-[10px]">Benchmark Retrieval Accuracy</span>
            <p className="text-verdigris font-semibold">{details.benchmarkAccuracy}</p>
          </div>
        </div>

        {/* System Architecture & Role */}
        <div className="space-y-2">
          <h4 className="text-xs font-sans uppercase tracking-wider text-gazette-brass font-semibold">
            System Directive & Statutory Scope
          </h4>
          <p className="font-sans text-sm text-court-paper/90 leading-relaxed bg-ink-navy/80 border border-slate/20 p-4 rounded-sm">
            {details.systemRole}
          </p>
        </div>

        {/* Statutory Tags */}
        <div className="space-y-2">
          <h4 className="text-xs font-sans uppercase tracking-wider text-slate font-semibold">
            Primary Codes & Acts
          </h4>
          <div className="flex flex-wrap gap-2">
            {agent.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-mono text-gazette-brass bg-gazette-brass/10 border border-gazette-brass/30 rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Sample Execution & Prompt Trace */}
        <div className="space-y-2 border-t border-slate/30 pt-4">
          <h4 className="text-xs font-sans uppercase tracking-wider text-gazette-brass font-semibold">
            Live Execution Simulation
          </h4>
          <div className="space-y-3 text-xs font-sans">
            <div className="bg-ink-navy/90 border border-slate/30 p-3 rounded-sm">
              <span className="text-slate text-[10px] uppercase tracking-wide block mb-1">Inquiry / Task</span>
              <p className="text-court-paper font-medium italic">&ldquo;{details.sampleQuery}&rdquo;</p>
            </div>
            <div className="bg-ink-navy border border-gazette-brass/30 p-3.5 rounded-sm font-mono text-[11px] text-court-paper/90 whitespace-pre-wrap leading-relaxed">
              <span className="text-gazette-brass text-[10px] uppercase tracking-wide font-sans block mb-2 font-semibold">
                Specialist Agent Output
              </span>
              {details.sampleOutput}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate/30 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-sans font-medium text-slate hover:text-court-paper transition-colors"
          >
            Close
          </button>
          {onTestInPlayground && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onTestInPlayground(agent.name);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-sans font-semibold text-ink-navy bg-gazette-brass hover:bg-gazette-brass/90 border border-gazette-brass rounded-sm transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Test {agent.name} in Playground</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
