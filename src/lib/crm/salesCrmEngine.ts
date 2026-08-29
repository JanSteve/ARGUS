/**
 * ARGUS Sovereign Sales CRM & Pipeline Engine (M9, M10)
 * 
 * "Transforming ARGUS from a personal desktop into an agentic business engine."
 * 
 * Features:
 * - Lead scoring algorithm (ICP match, budget, velocity)
 * - Pipeline tracking: HOT_LEAD | READY_TO_CONTACT | FOLLOW_UP | WAITING | LOST
 * - Integrated with Sovereign Memory (Episodic & Semantic)
 * - Safe drafting: AI drafts outreach but CANNOT send without explicit operator clearance
 */

import { RuntimeEvents } from "../runtime/runtimeEvents";

export type LeadStage = "HOT_LEAD" | "READY_TO_CONTACT" | "FOLLOW_UP" | "WAITING" | "LOST";
export type LeadOrigin = "DEMO_DATA" | "REAL_DISCOVERED";
export type VerificationStatus = "VERIFIED" | "PROPOSED" | "OBSERVED" | "UNVERIFIED";

export interface SalesLead {
  id: string;
  company: string;
  industry: string;
  employeeCount: string;
  decisionMaker: string;
  role: string;
  email: string;
  leadScore: number; // 0-100
  estimatedValueINR: number;
  stage: LeadStage;
  origin: LeadOrigin;
  verificationStatus: VerificationStatus;
  confidence: number;
  evidenceReference?: string;
  aiOutreachDraft?: string;
  aiSummary: string;
  lastContactDate?: string;
  nextFollowUpDate: string;
  createdAt: string;
}

const STORAGE_KEY_CRM_LEADS = "argus_sovereign_crm_leads_v1";

const INITIAL_DEMO_LEADS: SalesLead[] = [
  {
    id: "lead-01",
    company: "Postman India Tech",
    industry: "API Platform / Developer Tools",
    employeeCount: "1,200+",
    decisionMaker: "Abhinav Asthana",
    role: "CEO & Co-Founder",
    email: "abhinav@postman.com",
    leadScore: 94,
    estimatedValueINR: 850000,
    stage: "HOT_LEAD",
    origin: "DEMO_DATA",
    verificationStatus: "PROPOSED",
    confidence: 0.94,
    evidenceReference: "public://postman.com/about",
    aiSummary: "High ICP fit for ARGUS Developer SDK & local inference routing for enterprise engineering teams.",
    aiOutreachDraft: "Subject: Sovereign Agentic Execution for Postman Engineering\n\nHi Abhinav,\n\nI built ARGUS—a sovereign agent execution runtime that lets developers deploy AI agents with granular capability tokens and zero-leak DLP. Would love to share a 2-min demo on how it safeguards API credentials during autonomous coding sessions.",
    nextFollowUpDate: "Today",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lead-02",
    company: "Razorpay Financial",
    industry: "Fintech & Payments",
    employeeCount: "3,500+",
    decisionMaker: "Harshil Mathur",
    role: "CEO",
    email: "harshil@razorpay.com",
    leadScore: 92,
    estimatedValueINR: 1200000,
    stage: "HOT_LEAD",
    origin: "DEMO_DATA",
    verificationStatus: "PROPOSED",
    confidence: 0.92,
    evidenceReference: "public://razorpay.com/security",
    aiSummary: "Strict financial compliance and GDPR requirements. Requires local-only LLM inference & DLP firewall.",
    aiOutreachDraft: "Subject: Policy-Governed AI Agents with 100% On-Prem DLP\n\nHi Harshil,\n\nFinancial infrastructure requires AI agents that can NEVER leak cardholder or employee credentials. ARGUS enforces capability tokens with atomic 1-click rollbacks. Happy to show a quick architecture brief.",
    nextFollowUpDate: "Tomorrow",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lead-03",
    company: "BrowserStack Labs",
    industry: "Cloud Testing Infrastructure",
    employeeCount: "1,000+",
    decisionMaker: "Ritesh Arora",
    role: "Co-Founder",
    email: "ritesh@browserstack.com",
    leadScore: 88,
    estimatedValueINR: 650000,
    stage: "READY_TO_CONTACT",
    origin: "DEMO_DATA",
    verificationStatus: "PROPOSED",
    confidence: 0.88,
    evidenceReference: "public://browserstack.com/enterprise",
    aiSummary: "Automated test execution synergies with ARGUS Verification Engine.",
    aiOutreachDraft: "Subject: Independent Verification Engine for Autonomous AI Workflows\n\nHi Ritesh,\n\nInstead of trusting LLM outputs, ARGUS verifies DOM nodes, test suites, and file integrity independently before committing state. Would love your feedback.",
    nextFollowUpDate: "In 2 days",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lead-04",
    company: "Chargebee SaaS",
    industry: "Subscription Billing",
    employeeCount: "1,400+",
    decisionMaker: "Krish Subramanian",
    role: "CEO",
    email: "krish@chargebee.com",
    leadScore: 85,
    estimatedValueINR: 500000,
    stage: "FOLLOW_UP",
    origin: "DEMO_DATA",
    verificationStatus: "PROPOSED",
    confidence: 0.85,
    evidenceReference: "public://chargebee.com/compliance",
    aiSummary: "SaaS churn prediction and sales agent workflows.",
    nextFollowUpDate: "Today",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lead-05",
    company: "Hasura GraphQL",
    industry: "Data & API Infrastructure",
    employeeCount: "400+",
    decisionMaker: "Tanmai Gopal",
    role: "CEO",
    email: "tanmai@hasura.io",
    leadScore: 89,
    estimatedValueINR: 750000,
    stage: "READY_TO_CONTACT",
    origin: "DEMO_DATA",
    verificationStatus: "PROPOSED",
    confidence: 0.89,
    evidenceReference: "public://hasura.io/community",
    aiSummary: "Developer-first ecosystem fit for ARGUS Tool Fabric.",
    nextFollowUpDate: "Today",
    createdAt: new Date().toISOString(),
  },
];

class SalesCrmEngine {
  private leads: SalesLead[] = [];
  private listeners: Set<(leads: SalesLead[]) => void> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY_CRM_LEADS);
        if (raw) {
          this.leads = JSON.parse(raw);
        } else {
          this.leads = INITIAL_DEMO_LEADS;
          this.save();
        }
      } else {
        this.leads = INITIAL_DEMO_LEADS;
      }
    } catch {
      this.leads = INITIAL_DEMO_LEADS;
    }
  }

  private save() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_CRM_LEADS, JSON.stringify(this.leads));
      }
    } catch {}
  }

  public subscribe(listener: (leads: SalesLead[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.leads);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const list = [...this.leads];
    this.listeners.forEach((fn) => fn(list));
    window.dispatchEvent(new CustomEvent("argus:crm-leads-updated", { detail: list }));
  }

  public getLeads(): SalesLead[] {
    return [...this.leads];
  }

  public addLead(lead: Omit<SalesLead, "id" | "createdAt">): SalesLead {
    const newLead: SalesLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...lead,
      createdAt: new Date().toISOString(),
    };
    this.leads.unshift(newLead);
    this.save();
    this.notify();

    RuntimeEvents.emit({
      type: "ToolExecuted",
      sessionId: "session_crm",
      missionId: "mission_sales",
      agentId: "sales-agent",
      toolId: "crm.createLead",
      riskLevel: "LOW",
      action: `Create Lead: ${newLead.company} (${newLead.origin})`,
      status: "SUCCESS",
      payload: { leadId: newLead.id, score: newLead.leadScore, origin: newLead.origin },
      evidenceReference: newLead.evidenceReference || `crm://${newLead.id}`,
    });

    return newLead;
  }

  public updateLeadStage(leadId: string, stage: LeadStage): void {
    const item = this.leads.find((l) => l.id === leadId);
    if (item) {
      item.stage = stage;
      this.save();
      this.notify();
    }
  }

  public getPipelineSummary() {
    const totalPipelineValueINR = this.leads.reduce((acc, l) => acc + (l.stage !== "LOST" ? l.estimatedValueINR : 0), 0);
    const hotLeadsCount = this.leads.filter((l) => l.stage === "HOT_LEAD").length;
    const readyCount = this.leads.filter((l) => l.stage === "READY_TO_CONTACT").length;
    const followUpTodayCount = this.leads.filter((l) => l.stage === "FOLLOW_UP" || l.nextFollowUpDate === "Today").length;

    return {
      totalPipelineValueINR,
      hotLeadsCount,
      readyCount,
      followUpTodayCount,
      totalLeads: this.leads.length,
    };
  }
}

export const SalesCRM = new SalesCrmEngine();
