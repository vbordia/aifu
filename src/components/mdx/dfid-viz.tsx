"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface DFIDStep {
  iteration: number;
  bound: number;
  current: string | null;
  description: string;
  visitedThisIteration: string[];
  goalFound: boolean;
  nodesVisitedSoFar: number;
}

const TREE_POSITIONS: Record<string, { x: number; y: number }> = {
  S: { x: 400, y: 40 },
  A: { x: 160, y: 190 },
  B: { x: 400, y: 190 },
  C: { x: 640, y: 190 },
  D: { x: 60, y: 340 },
  E: { x: 260, y: 340 },
  F: { x: 400, y: 340 },
  G: { x: 640, y: 340 },
};

const TREE_EDGES = [
  { source: "S", target: "A", id: "t-sa" },
  { source: "S", target: "B", id: "t-sb" },
  { source: "S", target: "C", id: "t-sc" },
  { source: "A", target: "D", id: "t-ad" },
  { source: "A", target: "E", id: "t-ae" },
  { source: "B", target: "F", id: "t-bf" },
  { source: "C", target: "G", id: "t-cg" },
];

const STEPS: DFIDStep[] = [
  {
    iteration: 1,
    bound: 0,
    current: null,
    description:
      "Iteration 1 begins with depth bound = 0. Run depth-bounded DFS starting at S.",
    visitedThisIteration: [],
    goalFound: false,
    nodesVisitedSoFar: 0,
  },
  {
    iteration: 1,
    bound: 0,
    current: "S",
    description:
      "Visit S (depth 0). No goal here — but S's children would be at depth 1 > bound 0, so we generate nothing. Iteration 1 done after visiting just 1 node.",
    visitedThisIteration: ["S"],
    goalFound: false,
    nodesVisitedSoFar: 1,
  },
  {
    iteration: 2,
    bound: 1,
    current: null,
    description:
      "Iteration 2: throw everything away, restart DFS from scratch with bound = 1.",
    visitedThisIteration: [],
    goalFound: false,
    nodesVisitedSoFar: 1,
  },
  {
    iteration: 2,
    bound: 1,
    current: "A",
    description:
      "Re-visit S, then dive to A (depth 1). A is not the goal; its children are at depth 2 > bound, so no expansion.",
    visitedThisIteration: ["S", "A"],
    goalFound: false,
    nodesVisitedSoFar: 2,
  },
  {
    iteration: 2,
    bound: 1,
    current: "B",
    description:
      "Backtrack, visit B (depth 1). Not the goal. Children out of budget.",
    visitedThisIteration: ["S", "A", "B"],
    goalFound: false,
    nodesVisitedSoFar: 3,
  },
  {
    iteration: 2,
    bound: 1,
    current: "C",
    description:
      "Visit C (depth 1). Not the goal either. Iteration 2 done: 4 nodes visited total (3 of them re-visits!).",
    visitedThisIteration: ["S", "A", "B", "C"],
    goalFound: false,
    nodesVisitedSoFar: 5,
  },
  {
    iteration: 3,
    bound: 2,
    current: null,
    description:
      "Iteration 3: restart again with bound = 2. This time the search can reach depth 2.",
    visitedThisIteration: [],
    goalFound: false,
    nodesVisitedSoFar: 5,
  },
  {
    iteration: 3,
    bound: 2,
    current: "D",
    description:
      "Re-visit S → A → D (depth 2). D is not the goal. D has no children in this tree anyway.",
    visitedThisIteration: ["S", "A", "D"],
    goalFound: false,
    nodesVisitedSoFar: 6,
  },
  {
    iteration: 3,
    bound: 2,
    current: "E",
    description:
      "Backtrack to A, then visit E (depth 2). Not the goal.",
    visitedThisIteration: ["S", "A", "D", "E"],
    goalFound: false,
    nodesVisitedSoFar: 7,
  },
  {
    iteration: 3,
    bound: 2,
    current: "F",
    description:
      "Backtrack to S, dive into B → F (depth 2). Still not the goal.",
    visitedThisIteration: ["S", "A", "D", "E", "F"],
    goalFound: false,
    nodesVisitedSoFar: 8,
  },
  {
    iteration: 3,
    bound: 2,
    current: "G",
    description:
      "Backtrack to S, dive into C → G (depth 2). GoalTest(G) = TRUE! Found at depth 2 — the SHORTEST possible path length, exactly like BFS would have found it. Total across all iterations: 13 node visits (vs 8 for a single depth-2 search). The extra 5 visits are internal nodes re-explored — cheap, because leaves vastly outnumber internals in a big tree.",
    visitedThisIteration: ["S", "A", "D", "E", "F", "G"],
    goalFound: true,
    nodesVisitedSoFar: 13,
  },
];

export default function DFIDViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const visitedSet = new Set(step.visitedThisIteration);
  const pathSet = new Set(step.goalFound ? ["S", "C", "G"] : []);

  const nodeElements: ElementDefinition[] = Object.keys(TREE_POSITIONS).map((id) => {
    let type = "";
    if (pathSet.has(id)) type = "path";
    else if (step.current === id) type = "current";
    else if (visitedSet.has(id)) type = "explored";
    return { data: { id, label: id, type }, position: TREE_POSITIONS[id] };
  });

  const edgeElements: ElementDefinition[] = TREE_EDGES.map((e) => ({
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      type: step.goalFound && pathSet.has(e.source) && pathSet.has(e.target) ? "path" : "",
    },
  }));

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              DFID Trace
            </span>
            <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              Iteration {step.iteration} · bound d ≤ {step.bound}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx(0)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => i - 1)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={stepIdx >= STEPS.length - 1}
              onClick={() => setStepIdx((i) => i + 1)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <CytoscapeGraph
        elements={[...nodeElements, ...edgeElements]}
        height={420}
        nodeWidth={64}
        nodeHeight={64}
        nodeFontSize={16}
        usePresetPositions
        layout={{ name: "preset" }}
      />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} />
            <span className="text-foreground/50">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-gray-400" style={{ backgroundColor: "#4b5563" }} />
            <span className="text-foreground/50">Visited this iteration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-green-400" style={{ backgroundColor: "#15803d" }} />
            <span className="text-foreground/50">Path to Goal</span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-foreground/65">{step.description}</p>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Depth Bound</div>
            <div className="text-[13px] font-medium text-amber-600 dark:text-amber-400">{step.bound}</div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Total Node Visits</div>
            <div className="text-[13px] font-medium text-foreground/80">{step.nodesVisitedSoFar}</div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Open Size</div>
            <div className="text-[13px] font-medium text-green-600 dark:text-green-400">≤ {step.bound + 1} nodes (linear!)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
