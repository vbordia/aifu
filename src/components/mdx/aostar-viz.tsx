"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface AOStep {
  current: string | null;
  description: string;
  visibleNodes: string[];
  solvedNodes: string[];
  markedEdges: string[];
  costs: Record<string, number | null>;
}

const POSITIONS: Record<string, { x: number; y: number }> = {
  S: { x: 400, y: 40 },
  A: { x: 170, y: 210 },
  B: { x: 530, y: 210 },
  G: { x: 530, y: 380 },
  L1: { x: 420, y: 520 },
  L2: { x: 640, y: 520 },
};

const EDGES = [
  { source: "S", target: "A", id: "ao-sa" },
  { source: "S", target: "B", id: "ao-sb" },
  { source: "B", target: "G", id: "ao-bg" },
  { source: "G", target: "L1", id: "ao-gl1" },
  { source: "G", target: "L2", id: "ao-gl2" },
];

const STEPS: AOStep[] = [
  {
    current: null,
    description:
      "Start. Only the root S exists. Edge costs are all 1. Solved (primitive) nodes cost 0. Unexpanded nodes carry heuristic estimates h.",
    visibleNodes: ["S"],
    solvedNodes: [],
    markedEdges: [],
    costs: {},
  },
  {
    current: "S",
    description:
      "FORWARD phase: expand S → children A (h=6) and B (h=4). BACKWARD phase: compare options. Via A: 6 + 1(edge) = 7. Via B: 4 + 1 = 5. Cheaper wins → MARK S → B. Backed-up cost of S = 5.",
    visibleNodes: ["S", "A", "B"],
    solvedNodes: [],
    markedEdges: ["ao-sb"],
    costs: { S: 5, A: 6, B: 4 },
  },
  {
    current: "B",
    description:
      "Follow the marked path down to a live (unexpanded) node: B. Expand it → child G (h=2). Re-evaluate B: via G costs 2 + 1 = 3, so mark B → G. Propagate upward: S's cost via B becomes 3 + 1 = 4. Still cheaper than A's 7 — the marker stays on B.",
    visibleNodes: ["S", "A", "B", "G"],
    solvedNodes: [],
    markedEdges: ["ao-sb", "ao-bg"],
    costs: { S: 4, A: 6, B: 3, G: 2 },
  },
  {
    current: "G",
    description:
      "Expand G → an AND pair of primitive (solved) leaves, each costing 0. G's true cost = 0 + 0 + 1 + 1 = 2. Both successors on its marked path are solved → label G SOLVED. Back up: B = 2 + 1 = 3, and since G is solved, B is SOLVED too. Propagate to S: cost = 3 + 1 = 4. Its marked successor B is solved → ROOT IS SOLVED. Solution subtree found at cost 4 — notice A (h=6) was NEVER expanded. AO\* works on backed-up costs, not raw heuristic values.",
    visibleNodes: ["S", "A", "B", "G", "L1", "L2"],
    solvedNodes: ["G", "B", "S", "L1", "L2"],
    markedEdges: ["ao-sb", "ao-bg"],
    costs: { S: 4, A: 6, B: 3, G: 2 },
  },
];

const LABELS: Record<string, string> = {
  S: "S",
  A: "A\nh = 6",
  B: "B",
  G: "G\nh = 2",
  L1: "solved\n(0)",
  L2: "solved\n(0)",
};

export default function AOStarViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const visibleSet = new Set(step.visibleNodes);
  const solvedSet = new Set(step.solvedNodes);
  const currentSet = new Set(step.current ? [step.current] : []);
  const markedSet = new Set(step.markedEdges);

  const nodeElements: ElementDefinition[] = Object.keys(POSITIONS)
    .filter((id) => visibleSet.has(id))
    .map((id) => {
      let type = "";
      if (solvedSet.has(id)) type = "path";
      else if (currentSet.has(id)) type = "current";
      else type = "frontier";
      return { data: { id, label: LABELS[id], type }, position: POSITIONS[id] };
    });

  const edgeElements: ElementDefinition[] = EDGES
    .filter((e) => visibleSet.has(e.source) && visibleSet.has(e.target))
    .map((e) => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        label: "1",
        type: markedSet.has(e.id) ? "path" : "",
      },
    }));

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              AO* Trace
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
        height={600}
        nodeWidth={96}
        nodeHeight={64}
        nodeFontSize={12}
        usePresetPositions
        layout={{ name: "preset" }}
      />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} />
            <span className="text-foreground/50">Expanding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-sky-400" style={{ backgroundColor: "#0369a1" }} />
            <span className="text-foreground/50">Generated, unsolved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-green-400" style={{ backgroundColor: "#15803d" }} />
            <span className="text-foreground/50">Solved / marked path</span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-foreground/65">{step.description}</p>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {(["S", "A", "B"] as const).map((id) => (
            <div key={id} className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                {id === "S" ? "Backed-up cost of root" : `Node ${id}`}
              </div>
              <div className={`text-[13px] font-medium ${step.costs[id] == null ? "text-foreground/30" : id === "S" ? "text-green-600 dark:text-green-400" : step.solvedNodes.includes(id) ? "text-green-600 dark:text-green-400" : "text-foreground/70"}`}>
                {id === "S"
                  ? step.costs.S != null ? `${step.costs.S}${step.solvedNodes.includes("S") ? "  ✓ SOLVED" : ""}` : "?"
                  : step.costs[id] != null ? `${step.costs[id]}${step.solvedNodes.includes(id) ? "  ✓" : ""}` : "?"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
