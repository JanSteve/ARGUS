export interface StatItem {
  value: string;
  label: string;
}

export const statsData = {
  intro: {
    heading: "India's legal system is at an inflection point.",
    body: "Millions of cases wait in courts. Economic losses from delay cost billions. And AI adoption in law is just beginning — the founding window for Verdikt is right now.",
  },
  statsRowPrimary: [
    { value: "50M+", label: "Cases pending in Indian courts" },
    { value: "1.5M+", label: "Enrolled advocates underserved by modern tooling" },
    { value: "$42B", label: "Projected India legaltech market by 2034" },
    { value: "<5%", label: "Practitioners using AI today — window wide open" },
  ] as StatItem[],
  statsRowSecondary: [
    { value: "2%", label: "GDP lost annually to judicial delay" },
    { value: "57%", label: "Legal professionals already exploring AI tools" },
    { value: "22", label: "Court jurisdictions, each with distinct rules and procedures" },
    { value: "Now", label: "AI, digital courts and a new legal generation have aligned — a rare founding window." },
  ] as StatItem[],
};
