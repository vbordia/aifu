"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface DijkstraStep {
  current: string | null;
  description: string;
  gValues: Record<string, number | null>;
  visitedNodes: string[];
  frontierNodes: string[];
  pathNodes?: string[];
}

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  S: { x: 60, y: 180 },
  A: { x: 250, y: 70 },
  B: { x: 270, y: 300 },
  C: { x: 450, y: 90 },
  D: { x: 580, y: 240 },
};

const EDGES = [
  { source: "S", target: "A", cost: 2, id: "e-sa" },
  { source: "S", target: "B", cost: 5, id: "e-sb" },
  { source: "A", target: "B", cost: 1, id: "e-ab" },
  { source: "A", target: "C", cost: 4, id: "e-ac" },
  { source: "B", target: "C", cost: 2, id: "e-bc" },
  { source: "B", target: "D", cost: 6, id: "e-bd" },
  { source: "C", target: "D", cost: 1, id: "e-cd" },
];

const STEPS: DijkstraStep[] = [
  {
    current: null,
    description:
      "Initialize: every node gets g = ∞ except the start node, which gets g = 0. All nodes start white (unvisited).",
    gValues: { S: 0, A: null, B: null, C: null, D: null },
    visitedNodes: [],
    frontierNodes: ["S"],
  },
  {
    current: "S",
    description:
      "Pick the cheapest unvisited node: S with g = 0. Color it black (visited) and RELAX its outgoing edges: A improves ∞ → 0 + 2 = 2 (parent S). B improves ∞ → 0 + 5 = 5 (parent S).",
    gValues: { S: 0, A: 2, B: 5, C: null, D: null },
    visitedNodes: ["S"],
    frontierNodes: ["A", "B"],
  },
  {
    current: "A",
    description:
      "Cheapest unvisited node is A (g = 2), not B (g = 5)! Visit A and relax: B improves 5 → 2 + 1 = 3 via A (parent updated to A!). C improves ∞ → 2 + 4 = 6 via A.",
    gValues: { S: 0, A: 2, B: 3, C: 6, D: null },
    visitedNodes: ["S", "A"],
    frontierNodes: ["B", "C"],
  },
  {
    current: "B",
    description:
      "Cheapest unvisited is now B (g = 3). Visit B and relax: C improves 6 → 3 + 2 = 5 via B. D improves ∞ → 3 + 6 = 9 via B.",
    gValues: { S: 0, A: 2, B: 3, C: 5, D: 9 },
    visitedNodes: ["S", "A", "B"],
    frontierNodes: ["C", "D"],
  },
  {
    current: "C",
    description:
      "Visit C (g = 5). Relax: D improves 9 → 5 + 1 = 6 via C. Notice how each relaxation only ever DECREASES a g-value — once a node is black, no cheaper path can appear (all edges are positive), so it is never revisited.",
    gValues: { S: 0, A: 2, B: 3, C: 5, D: 6 },
    visitedNodes: ["S", "A", "B", "C"],
    frontierNodes: ["D"],
  },
  {
    current: "D",
    description:
      "Visit D — this is the GOAL! g(D) = 6 is final. Follow parent pointers back: D ← C ← B ← A ← S. Optimal path: S → A → B → C → D with total cost 2 + 1 + 2 + 1 = 6. With h = 0 everywhere, this trace is exactly what Branch & Bound / UCS does — and it's also what A* would compute if its heuristic returned zero.",
    gValues: { S: 0, A: 2, B: 3, C: 5, D: 6 },
    visitedNodes: ["S", "A", "B", "C", "D"],
    frontierNodes: [],
    pathNodes: ["S", "A", "B", "C", "D"],
  },
];

function fmtG(v: number | null): string {
  return v === null ? "∞" : String(v);
}

export default function DijkstraViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const pathSet = new Set(step.pathNodes ?? []);
  const currentSet = new Set(step.current ? [step.current] : []);
  const frontierSet = new Set(step.frontierNodes.filter((n) => !currentSet.has(n) && !pathSet.has(n)));
  const visitedSet = new Set(step.visitedNodes.filter((n) => !currentSet.has(n) && !pathSet.has(n)));

  const nodeElements: ElementDefinition[] = Object.keys(NODE_POSITIONS).map((id) => {
    let type = "";
    if (id === "S") type = "start";
    if (id === "D") type = "goal";
    if (pathSet.has(id)) type = "path";
    else if (currentSet.has(id)) type = "current";
    else if (frontierSet.has(id)) type = "frontier";
    else if (visitedSet.has(id)) type = "explored";
    const label = `${id}\ng = ${fmtG(step.gValues[id] ?? null)}`;
    return { data: { id, label, type }, position: NODE_POSITIONS[id] };
  });

  const edgeElements: ElementDefinition[] = EDGES.map((e) => ({
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      label: String(e.cost),
      type: pathSet.has(e.source) && pathSet.has(e.target) ? "path" : "",
    },
  }));

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              Dijkstra Trace
            </span>
            <span className="text-[13px] font-medium text-foreground/70">
              Step {stepIdx} / {STEPS.length - 1}
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
        nodeWidth={96}
        nodeHeight={64}
        nodeFontSize={12}
        usePresetPositions
        layout={{ name: "preset" }}
        wide
      />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} />
            <span className="text-foreground/50">Current (cheapest unvisited)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-sky-400" style={{ backgroundColor: "#0369a1" }} />
            <span className="text-foreground/50">White — tentative g</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-gray-400" style={{ backgroundColor: "#4b5563" }} />
            <span className="text-foreground/50">Black — g finalized</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-green-400" style={{ backgroundColor: "#15803d" }} />
            <span className="text-foreground/50">Shortest Path</span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-foreground/65">{step.description}</p>

        <div className="mt-3 grid grid-cols-5 gap-2">
          {(["S", "A", "B", "C", "D"] as const).map((id) => (
            <div key={id} className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{id}</div>
              <div className={`text-[13px] font-medium ${step.gValues[id] === null ? "text-foreground/40" : "text-green-600 dark:text-green-400"}`}>
                g = {fmtG(step.gValues[id] ?? null)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
