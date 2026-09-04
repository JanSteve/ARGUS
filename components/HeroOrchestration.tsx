"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const agentNodes = [
  { label: "Corporate", angle: 0 },
  { label: "Civil", angle: 30 },
  { label: "Criminal", angle: 60 },
  { label: "Constitutional", angle: 90 },
  { label: "Family", angle: 120 },
  { label: "Labour", angle: 150 },
  { label: "IP", angle: 180 },
  { label: "Tax", angle: 210 },
  { label: "Property", angle: 240 },
  { label: "Banking", angle: 270 },
  { label: "Consumer", angle: 300 },
  { label: "Environment", angle: 330 },
];

export function HeroOrchestration() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const cx = 220;
  const cy = 220;
  const radius = 145;

  // Selected agent for route demonstration: Criminal (60 deg)
  const targetNode = agentNodes[2];
  const targetRad = (targetNode.angle * Math.PI) / 180;
  const targetX = cx + radius * Math.cos(targetRad);
  const targetY = cy + radius * Math.sin(targetRad);

  // Path coordinates: Query (40, 220) -> Core (cx, cy) -> Target (targetX, targetY) -> Output (400, 320)
  const queryX = 40;
  const queryY = 220;
  const outputX = 390;
  const outputY = 300;

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-[460px] aspect-square bg-ink-navy border border-slate/20 rounded-sm p-4 select-none">
        <svg
          viewBox="0 0 440 440"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label="Verdikt Multi-Agent Orchestration Diagram"
        >
          <title>Verdikt Orchestration Flow</title>
          <desc>
            Diagram showing incoming lawyer query routed through Verdikt Core to 12
            specialist legal agents and producing verified legal output.
          </desc>

          {/* Background Outer Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#AD8A46"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.3"
          />

          {/* Radiating Hairline Lines to All 12 Nodes */}
          {agentNodes.map((node) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = cx + radius * Math.cos(rad);
            const y = cy + radius * Math.sin(rad);
            return (
              <line
                key={node.label}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="#AD8A46"
                strokeWidth="1"
                opacity={node.label === "Criminal" ? "0.85" : "0.2"}
              />
            );
          })}

          {/* Active Highlighted Route Lines */}
          {/* Query to Core */}
          <line
            x1={queryX}
            y1={queryY}
            x2={cx}
            y2={cy}
            stroke="#AD8A46"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.75"
          />
          {/* Core to Target Agent */}
          <line
            x1={cx}
            y1={cy}
            x2={targetX}
            y2={targetY}
            stroke="#AD8A46"
            strokeWidth="1.5"
            opacity="0.9"
          />
          {/* Target Agent to Output */}
          <line
            x1={targetX}
            y1={targetY}
            x2={outputX}
            y2={outputY}
            stroke="#AD8A46"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.75"
          />

          {/* Query Source Label */}
          <g>
            <rect
              x={queryX - 34}
              y={queryY - 12}
              width="68"
              height="24"
              fill="#101826"
              stroke="#56606E"
              strokeWidth="1"
              rx="2"
            />
            <text
              x={queryX}
              y={queryY + 4}
              fill="#EEEAE0"
              fontSize="10"
              fontFamily="var(--font-ibm-plex-sans)"
              textAnchor="middle"
              fontWeight="500"
            >
              Query
            </text>
          </g>

          {/* Output Destination Label */}
          <g>
            <rect
              x={outputX - 36}
              y={outputY - 12}
              width="72"
              height="24"
              fill="#101826"
              stroke="#45735F"
              strokeWidth="1"
              rx="2"
            />
            <text
              x={outputX}
              y={outputY + 4}
              fill="#45735F"
              fontSize="10"
              fontFamily="var(--font-ibm-plex-sans)"
              textAnchor="middle"
              fontWeight="600"
            >
              Output
            </text>
          </g>

          {/* 12 Agent Peripheral Dots & Short Labels */}
          {agentNodes.map((node) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = cx + radius * Math.cos(rad);
            const y = cy + radius * Math.sin(rad);
            const isTarget = node.label === "Criminal";

            // Offset label slightly outward
            const labelDist = radius + 22;
            const lx = cx + labelDist * Math.cos(rad);
            const ly = cy + labelDist * Math.sin(rad);

            return (
              <g key={`node-${node.label}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isTarget ? 5 : 3.5}
                  fill={isTarget ? "#AD8A46" : "#101826"}
                  stroke="#AD8A46"
                  strokeWidth={isTarget ? 2 : 1}
                />
                <text
                  x={lx}
                  y={ly + 3}
                  fill={isTarget ? "#EEEAE0" : "#56606E"}
                  fontSize="8.5"
                  fontFamily="var(--font-ibm-plex-sans)"
                  textAnchor="middle"
                  fontWeight={isTarget ? "600" : "400"}
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          {/* Central Verdikt Core Node */}
          <g>
            <circle
              cx={cx}
              cy={cy}
              r="34"
              fill="#101826"
              stroke="#AD8A46"
              strokeWidth="1.5"
            />
            <circle
              cx={cx}
              cy={cy}
              r="30"
              fill="#101826"
              stroke="#AD8A46"
              strokeWidth="0.75"
              strokeDasharray="2 2"
            />
            <text
              x={cx}
              y={cy - 4}
              fill="#AD8A46"
              fontSize="9"
              fontFamily="var(--font-ibm-plex-sans)"
              textAnchor="middle"
              fontWeight="600"
              letterSpacing="0.06em"
            >
              VERDIKT
            </text>
            <text
              x={cx}
              y={cy + 8}
              fill="#EEEAE0"
              fontSize="10"
              fontFamily="var(--font-ibm-plex-sans)"
              textAnchor="middle"
              fontWeight="500"
            >
              Core
            </text>
          </g>

          {/* The One Animated Moment: Single Oxblood Dot (Respects Reduced Motion) */}
          {!prefersReducedMotion ? (
            <motion.circle
              r="4.5"
              fill="#7A2A22"
              stroke="#EEEAE0"
              strokeWidth="1"
              animate={{
                cx: [queryX, cx, targetX, outputX],
                cy: [queryY, cy, targetY, outputY],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 7.5,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.35, 0.7, 1],
              }}
            />
          ) : (
            // Static frozen position for reduced-motion users
            <circle
              cx={targetX}
              cy={targetY}
              r="4.5"
              fill="#7A2A22"
              stroke="#EEEAE0"
              strokeWidth="1"
            />
          )}
        </svg>

        {/* Legend status note */}
        <div className="mt-2 text-center text-[11px] font-sans text-slate flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-sm bg-seal-oxblood inline-block" />
          <span>Active query route • Continuous domain orchestration</span>
        </div>
      </div>
    </div>
  );
}
