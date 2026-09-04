"use client";

import { useState, useMemo } from "react";
import { agents, agentGroups, LegalAgent } from "@/content/agents";
import { OrchestrationFlow } from "./OrchestrationFlow";

export function AgentDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  // Accordion state for mobile: first group open by default
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Commercial & Regulatory Law": true,
    "Public & Procedural Law": false,
    "Individual & Social Law": false,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // Filter agents by name, domain, or tag
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    const q = searchQuery.toLowerCase().trim();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        agent.domain.toLowerCase().includes(q) ||
        agent.desc.toLowerCase().includes(q) ||
        agent.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Group filtered agents
  const groupedAgents = useMemo(() => {
    const map: Record<string, LegalAgent[]> = {
      "Commercial & Regulatory Law": [],
      "Public & Procedural Law": [],
      "Individual & Social Law": [],
    };
    filteredAgents.forEach((a) => {
      if (map[a.group]) {
        map[a.group].push(a);
      }
    });
    return map;
  }, [filteredAgents]);

  return (
    <section id="agents" className="bg-court-paper text-ink-navy py-20 md:py-28 border-b border-slate/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-ink-navy">
            The Agent Directory
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate leading-relaxed">
            Verdikt does not rely on a single generalist model. Twelve specialist agents are
            independently trained on their respective Indian statutes, court precedents, and
            procedural codes.
          </p>
        </div>

        {/* 6-Step Orchestration Sequence */}
        <OrchestrationFlow />

        {/* Top Control Bar: Search Input & Status Legend */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 pb-4 border-b border-slate/20">
          <div className="flex items-center gap-2 text-xs font-sans font-medium text-slate">
            <span className="w-2 h-2 rounded-sm bg-verdigris inline-block" />
            <span>Actively trained and updated</span>
          </div>

          {/* Search / Filter Input */}
          <div className="w-full sm:w-72">
            <label htmlFor="agent-search" className="sr-only">
              Filter agents by law, statute, or name
            </label>
            <input
              id="agent-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by law, tag, or act…"
              className="w-full text-xs font-sans px-3 py-2 bg-court-paper/70 border border-slate/30 text-ink-navy placeholder:text-slate rounded-sm focus:border-gazette-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass"
            />
          </div>
        </div>

        {/* Desktop Table View (>= 1024px) */}
        <div className="hidden lg:block overflow-x-auto mt-6">
          <table className="w-full text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-slate/30 text-xs text-slate font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-44">Agent</th>
                <th className="py-3 px-4 w-52">Domain</th>
                <th className="py-3 px-4">Statutory Scope & Precedents</th>
                <th className="py-3 px-4 w-60">Primary Codes</th>
                <th className="py-3 px-2 w-12 text-center" title="Active status">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {agentGroups.map((group) => {
                const groupItems = groupedAgents[group] || [];
                if (groupItems.length === 0) return null;

                return (
                  <tr key={group} className="contents">
                    {/* Group Header Row */}
                    <tr className="bg-slate/5 border-y border-slate/20">
                      <td
                        colSpan={5}
                        className="py-2.5 px-4 font-sans text-xs font-bold uppercase tracking-wider text-seal-oxblood"
                      >
                        {group} ({groupItems.length})
                      </td>
                    </tr>

                    {/* Agent Item Rows */}
                    {groupItems.map((agent) => (
                      <tr
                        key={agent.name}
                        className="border-b border-slate/15 hover:bg-court-paper/80 transition-colors"
                      >
                        <td className="py-4 px-4 font-semibold text-ink-navy">
                          {agent.name}
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-slate">
                          {agent.domain}
                        </td>
                        <td className="py-4 px-4 text-xs text-ink-navy/80 leading-relaxed max-w-md">
                          {agent.desc}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {agent.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-sm bg-court-paper border border-slate/25 text-ink-navy"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span
                            className="w-2 h-2 rounded-sm bg-verdigris inline-block"
                            title="Active & Trained"
                          />
                        </td>
                      </tr>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Accordion View (< 1024px) */}
        <div className="lg:hidden mt-6 space-y-4">
          {agentGroups.map((group) => {
            const groupItems = groupedAgents[group] || [];
            const isOpen = openGroups[group];

            return (
              <div
                key={group}
                className="border border-slate/20 rounded-sm bg-court-paper/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="w-full py-3.5 px-4 flex items-center justify-between text-left font-sans text-xs font-bold uppercase tracking-wider text-seal-oxblood bg-slate/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass"
                  aria-expanded={isOpen}
                >
                  <span>
                    {group} ({groupItems.length})
                  </span>
                  <span className="font-mono text-sm">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="p-4 divide-y divide-slate/15 space-y-4">
                    {groupItems.map((agent) => (
                      <div key={agent.name} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-sans text-sm font-semibold text-ink-navy">
                            {agent.name}
                          </h4>
                          <span
                            className="w-2 h-2 rounded-sm bg-verdigris inline-block"
                            title="Active & Trained"
                          />
                        </div>
                        <p className="font-sans text-xs text-seal-oxblood/90 font-medium">
                          {agent.domain}
                        </p>
                        <p className="font-sans text-xs text-ink-navy/80 leading-relaxed">
                          {agent.desc}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {agent.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-court-paper border border-slate/25 text-ink-navy"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state if search finds nothing */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-12 text-slate text-sm font-sans">
            No agents found matching &ldquo;{searchQuery}&rdquo;. Try searching for
            Companies Act, BNSS, Tax, or CPC.
          </div>
        )}

        {/* Closing Newsreader line */}
        <div className="mt-16 pt-8 border-t border-slate/20 text-center">
          <p className="font-display text-xl sm:text-2xl text-ink-navy font-normal tracking-tight">
            12 agents. Every law. One platform.
          </p>
        </div>
      </div>
    </section>
  );
}
