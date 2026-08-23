"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface Step {
  current: string;
  visited: string[];
  pathEdges: string[];
  description: string;
  tourCost: number;
  isComplete: boolean;
}

const CITIES = ["A", "B", "C", "D", "E"] as const;

const DIST: Record<string, Record<string, number>> = {
  A: { B: 3, C: 7, D: 10, E: 5 },
  B: { A: 3, C: 4, D: 9, E: 6 },
  C: { A: 7, B: 4, D: 8, E: 7 },
  D: { A: 10, B: 9, C: 8, E: 2 },
  E: { A: 5, B: 6, C: 7, D: 2 },
};

const POSITIONS: Record<string, { x: number; y: number }> = {
  A: { x: 100, y: 120 },
  B: { x: 300, y: 60 },
  C: { x: 620, y: 120 },
  D: { x: 540, y: 340 },
  E: { x: 200, y: 340 },
};

const EDGES = [
  { from: "A", to: "B", id: "a-b" },
  { from: "A", to: "C", id: "a-c" },
  { from: "A", to: "D", id: "a-d" },
  { from: "A", to: "E", id: "a-e" },
  { from: "B", to: "C", id: "b-c" },
  { from: "B", to: "D", id: "b-d" },
  { from: "B", to: "E", id: "b-e" },
  { from: "C", to: "D", id: "c-d" },
  { from: "C", to: "E", id: "c-e" },
  { from: "D", to: "E", id: "d-e" },
];

const STEPS: Step[] = [
  { current: "—", visited: [], pathEdges: [], description: "Start at city A. All cities unvisited.", tourCost: 0, isComplete: false },
  { current: "A", visited: ["A"], pathEdges: [], description: "Start at A. Find nearest unvisited neighbor: B(3) < E(5) < C(7) < D(10). Pick B.", tourCost: 0, isComplete: false },
  { current: "B", visited: ["A", "B"], pathEdges: ["a-b"], description: "At B. Nearest unvisited: C(4) < E(6) < D(9). Pick C.", tourCost: 3, isComplete: false },
  { current: "C", visited: ["A", "B", "C"], pathEdges: ["a-b", "b-c"], description: "At C. Nearest unvisited: E(7) < D(8). Pick E.", tourCost: 3 + 4, isComplete: false },
  { current: "E", visited: ["A", "B", "C", "E"], pathEdges: ["a-b", "b-c", "c-e"], description: "At E. Only D unvisited. Pick D.", tourCost: 3 + 4 + 7, isComplete: false },
  { current: "D", visited: ["A", "B", "C", "E", "D"], pathEdges: ["a-b", "b-c", "c-e", "d-e"], description: "At D. All cities visited. Return to A (cost 10).", tourCost: 3 + 4 + 7 + 2, isComplete: false },
  { current: "A", visited: ["A", "B", "C", "E", "D", "A"], pathEdges: ["a-b", "b-c", "c-e", "d-e", "a-d"], description: "Tour complete: A→B→C→E→D→A. Cost = 3+4+7+2+10 = 26. But optimal tour is A→E→D→C→B→A = 5+2+8+4+3 = 22. Nearest neighbor missed the optimal by 4!", tourCost: 26, isComplete: true },
];

function buildElements(step: Step): ElementDefinition[] {
  const visitedSet = new Set(step.visited);
  const pathEdgeSet = new Set(step.pathEdges);

  const nodeElements: ElementDefinition[] = CITIES.map((id) => {
    let type = "";
    if (step.isComplete && visitedSet.has(id)) type = "path";
    else if (step.current === id) type = "current";
    else if (visitedSet.has(id)) type = "explored";
    else type = "frontier";

    return { data: { id, label: id, type }, position: POSITIONS[id] };
  });

  const edgeElements: ElementDefinition[] = EDGES.map((e) => {
    const cost = DIST[e.from][e.to];
    return {
      data: {
        id: e.id,
        source: e.from,
        target: e.to,
        label: `${cost}` as string,
        type: pathEdgeSet.has(e.id) ? "path" : "",
      },
    };
  });

  return [...nodeElements, ...edgeElements];
}

export default function TSPViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const elements = buildElements(step);

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Nearest Neighbor</span>
            <span className="text-[13px] font-medium text-foreground/70">Step {stepIdx} / {STEPS.length - 1}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={stepIdx === 0} onClick={() => setStepIdx(0)} className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">Reset</button>
            <button type="button" disabled={stepIdx === 0} onClick={() => setStepIdx((i) => i - 1)} className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">← Prev</button>
            <button type="button" disabled={stepIdx === STEPS.length - 1} onClick={() => setStepIdx((i) => i + 1)} className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      </div>

      <CytoscapeGraph elements={elements} height={420} nodeWidth={60} nodeHeight={60} nodeFontSize={16} usePresetPositions layout={{ name: "preset" }} wide />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} /><span className="text-foreground/50">Current City</span></div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-green-400" style={{ backgroundColor: "#15803d" }} /><span className="text-foreground/50">Tour Path</span></div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-gray-400" style={{ backgroundColor: "#4b5563" }} /><span className="text-foreground/50">Visited</span></div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-sky-400" style={{ backgroundColor: "#0369a1" }} /><span className="text-foreground/50">Unvisited</span></div>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/65">{step.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Current Tour Cost</div>
            <div className="text-[13px] font-medium text-amber-600 dark:text-amber-400">{step.tourCost}</div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Visited</div>
            <div className="text-[13px] font-medium text-green-600 dark:text-green-400">{step.visited.length > 0 ? step.visited.join(" → ") : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
