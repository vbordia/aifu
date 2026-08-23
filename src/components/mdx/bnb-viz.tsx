"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface BnBStep {
  current: string;
  description: string;
  prunedNodes: string[];
  activeNodes: string[];
  solvedNodes: string[];
  bestUpperBound: number;
  currentLowerBound: number;
}

const NODES = ["root", "B1", "C1", "D1", "B2", "C2", "B3", "C3", "D3"] as const;

const NODE_LABELS: Record<string, string> = {
  root: "Start: A",
  B1: "A→B (5)",
  C1: "A→B→C (8)",
  D1: "A→B→C→D (12) ✓",
  B2: "A→C (8)",
  C2: "A→C→B (11)",
  B3: "A→D (6)",
  C3: "A→D→B (8)",
  D3: "A→D→B→C (12) ✓",
};

const NODE_BOUNDS: Record<string, number> = {
  root: 10, B1: 5, C1: 8, D1: 12, B2: 8, C2: 11, B3: 6, C3: 8, D3: 12,
};

const POSITIONS: Record<string, { x: number; y: number }> = {
  root: { x: 400, y: 50 },
  B1: { x: 140, y: 190 },
  B2: { x: 400, y: 190 },
  B3: { x: 660, y: 190 },
  C1: { x: 80, y: 340 },
  C2: { x: 400, y: 340 },
  C3: { x: 660, y: 340 },
  D1: { x: 80, y: 490 },
  D3: { x: 660, y: 490 },
};

const EDGES = [
  { from: "root", to: "B1", id: "e1" },
  { from: "root", to: "B2", id: "e2" },
  { from: "root", to: "B3", id: "e3" },
  { from: "B1", to: "C1", id: "e4" },
  { from: "B2", to: "C2", id: "e5" },
  { from: "B3", to: "C3", id: "e6" },
  { from: "C1", to: "D1", id: "e7" },
  { from: "C3", to: "D3", id: "e8" },
];

const STEPS: BnBStep[] = [
  {
    current: "—",
    description: "Start with TSP on 4 cities. Upper bound (UB) from nearest neighbor = 19. Lower bound at root from reduced cost matrix = 10.",
    prunedNodes: [], activeNodes: ["root"], solvedNodes: [],
    bestUpperBound: 19, currentLowerBound: 10,
  },
  {
    current: "root",
    description: "Branch from root: fix first city after A. Three branches: A→B (LB=5), A→C (LB=8), A→D (LB=6).",
    prunedNodes: [], activeNodes: ["B1", "B2", "B3"], solvedNodes: [],
    bestUpperBound: 19, currentLowerBound: 5,
  },
  {
    current: "B2",
    description: "Expand A→C (LB=8). Branch: A→C→B (LB=11). LB=11 > UB=19? No, keep exploring.",
    prunedNodes: [], activeNodes: ["B1", "C2", "B3"], solvedNodes: [],
    bestUpperBound: 19, currentLowerBound: 11,
  },
  {
    current: "C2",
    description: "A→C→B has LB=11. Only one path left: A→C→B→D. Complete tour cost = 8+3+2+6 = 19. New UB = 19 (same as initial).",
    prunedNodes: [], activeNodes: ["B1", "B3"], solvedNodes: ["B2", "C2"],
    bestUpperBound: 19, currentLowerBound: 19,
  },
  {
    current: "B1",
    description: "Expand A→B (LB=5). Branch: A→B→C (LB=8). LB=8 < UB=19, continue.",
    prunedNodes: [], activeNodes: ["C1", "B3"], solvedNodes: ["B2", "C2"],
    bestUpperBound: 19, currentLowerBound: 8,
  },
  {
    current: "C1",
    description: "A→B→C (LB=8). Only path: A→B→C→D. Complete tour = 5+3+4+6 = 18. New UB = 18! Better than 19.",
    prunedNodes: [], activeNodes: ["B3"], solvedNodes: ["B2", "C2", "B1", "C1", "D1"],
    bestUpperBound: 18, currentLowerBound: 18,
  },
  {
    current: "B3",
    description: "Now check A→D (LB=6). Branch: A→D→B (LB=8). LB=8 < UB=18, continue.",
    prunedNodes: [], activeNodes: ["C3"], solvedNodes: ["B2", "C2", "B1", "C1", "D1"],
    bestUpperBound: 18, currentLowerBound: 8,
  },
  {
    current: "C3",
    description: "A→D→B (LB=8). Only path: A→D→B→C. Complete tour = 6+2+3+8 = 19. Cost 19 > UB=18, so this is PRUNED. No update to UB.",
    prunedNodes: ["C3"], activeNodes: [], solvedNodes: ["B2", "C2", "B1", "C1", "D1", "B3"],
    bestUpperBound: 18, currentLowerBound: 19,
  },
  {
    current: "—",
    description: "All branches explored or pruned! Optimal tour: A→B→C→D→A with cost 18. BnB examined 7 nodes vs 6 total possible tours — saved by pruning A→D→B→C subtree.",
    prunedNodes: ["C3"], activeNodes: [], solvedNodes: ["B2", "C2", "B1", "C1", "D1", "B3", "root"],
    bestUpperBound: 18, currentLowerBound: 18,
  },
];

function buildElements(step: BnBStep): ElementDefinition[] {
  const prunedSet = new Set(step.prunedNodes);
  const activeSet = new Set(step.activeNodes);
  const solvedSet = new Set(step.solvedNodes);

  const nodeElements: ElementDefinition[] = NODES.map((id) => {
    let type = "";
    if (prunedSet.has(id)) type = "goal";
    else if (step.current === id) type = "current";
    else if (activeSet.has(id)) type = "frontier";
    else if (solvedSet.has(id)) type = "explored";
    else type = "";

    const label: string = `${NODE_LABELS[id]}\nLB=${NODE_BOUNDS[id]}`;

    return { data: { id, label, type }, position: POSITIONS[id] };
  }).filter((n) => {
    const hasEdge = EDGES.some((e) => e.from === n.data.id || e.to === n.data.id);
    const isRelevant = prunedSet.has(n.data.id) || activeSet.has(n.data.id) || solvedSet.has(n.data.id) || n.data.id === "root" || step.current === n.data.id;
    return hasEdge || isRelevant;
  });

  const edgeElements: ElementDefinition[] = EDGES.map((e) => ({
    data: { id: e.id, source: e.from, target: e.to, type: "" },
  })).filter((e) => nodeElements.some((n) => n.data.id === e.data.source) && nodeElements.some((n) => n.data.id === e.data.target));

  return [...nodeElements, ...edgeElements];
}

export default function BnBViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const elements = buildElements(step);

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Branch & Bound Trace</span>
            <span className="text-[13px] font-medium text-foreground/70">Step {stepIdx} / {STEPS.length - 1}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={stepIdx === 0} onClick={() => setStepIdx(0)} className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">Reset</button>
            <button type="button" disabled={stepIdx === 0} onClick={() => setStepIdx((i) => i - 1)} className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">← Prev</button>
            <button type="button" disabled={stepIdx === STEPS.length - 1} onClick={() => setStepIdx((i) => i + 1)} className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      </div>

      <CytoscapeGraph elements={elements} height={560} nodeWidth={130} nodeHeight={72} nodeFontSize={11} usePresetPositions layout={{ name: "preset" }} wide />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} /><span className="text-foreground/50">Current Branch</span></div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-sky-400" style={{ backgroundColor: "#0369a1" }} /><span className="text-foreground/50">Active (LB &lt; UB)</span></div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-gray-400" style={{ backgroundColor: "#4b5563" }} /><span className="text-foreground/50">Explored</span></div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-rose-400" style={{ backgroundColor: "#be123c" }} /><span className="text-foreground/50">Pruned (LB ≥ UB)</span></div>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/65">{step.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Best Upper Bound</div>
            <div className="text-[13px] font-medium text-green-600 dark:text-green-400">{step.bestUpperBound}</div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Current Lower Bound</div>
            <div className="text-[13px] font-medium text-amber-600 dark:text-amber-400">{step.currentLowerBound}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
