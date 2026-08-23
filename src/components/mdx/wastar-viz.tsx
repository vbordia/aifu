"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface Step {
  current: string;
  openList: string[];
  closedList: string[];
  gScores: Record<string, number>;
  fScores: Record<string, number>;
  description: string;
  pathNodes?: string[];
  pathEdges?: string[];
}

const NODES = ["S", "A", "B", "C", "D", "E", "F", "G"] as const;

const H_VALUES: Record<string, number> = { S: 6, A: 4, B: 2, C: 2, D: 3, E: 1, F: 1, G: 0 };

const W = 2;

const EDGES = [
  { from: "S", to: "A", cost: 1, id: "s-a" },
  { from: "S", to: "B", cost: 4, id: "s-b" },
  { from: "A", to: "C", cost: 3, id: "a-c" },
  { from: "A", to: "D", cost: 1, id: "a-d" },
  { from: "B", to: "E", cost: 1, id: "b-e" },
  { from: "C", to: "G", cost: 2, id: "c-g" },
  { from: "D", to: "F", cost: 2, id: "d-f" },
  { from: "E", to: "G", cost: 1, id: "e-g" },
  { from: "F", to: "G", cost: 1, id: "f-g" },
] as const;

const POSITIONS: Record<string, { x: number; y: number }> = {
  S: { x: 400, y: 50 },
  A: { x: 140, y: 210 },
  B: { x: 660, y: 210 },
  C: { x: 70, y: 370 },
  D: { x: 260, y: 370 },
  E: { x: 660, y: 370 },
  F: { x: 400, y: 520 },
  G: { x: 400, y: 650 },
};

const STEPS: Step[] = [
  {
    current: "—",
    openList: ["S"],
    closedList: [],
    gScores: { S: 0 },
    fScores: { S: 12 },
    description: `Initialize: Open = {S}. f(S) = g(S) + w×h(S) = 0 + ${W}×6 = 12. Weight w = ${W} inflates the heuristic.`,
  },
  {
    current: "S",
    openList: ["B", "A"],
    closedList: ["S"],
    gScores: { S: 0, A: 1, B: 4 },
    fScores: { S: 12, A: 9, B: 8 },
    description: `Expand S → A(g=1, f=1+${W}×4=9), B(g=4, f=4+${W}×2=8). With w=${W}, B looks more promising (f=8) because its low h=2 gets inflated. A* (w=1) would have picked A (f=5 vs f=6). Pick B.`,
  },
  {
    current: "B",
    openList: ["E", "A"],
    closedList: ["S", "B"],
    gScores: { S: 0, A: 1, B: 4, E: 5 },
    fScores: { S: 12, A: 9, B: 8, E: 7 },
    description: `Expand B → E(g=5, f=5+${W}×1=7). E has very low h=1, so WA* rushes toward it. Pick E (f=7).`,
  },
  {
    current: "E",
    openList: ["G", "A"],
    closedList: ["S", "B", "E"],
    gScores: { S: 0, A: 1, B: 4, E: 5, G: 6 },
    fScores: { S: 12, A: 9, B: 8, E: 7, G: 6 },
    description: `Expand E → G(g=6, f=6). G has the lowest f! Pick G.`,
  },
  {
    current: "G",
    openList: ["A"],
    closedList: ["S", "B", "E", "G"],
    gScores: { S: 0, A: 1, B: 4, E: 5, G: 6 },
    fScores: { S: 12, A: 9, B: 8, E: 7, G: 6 },
    description: `G is the goal! WA* (w=${W}) finds path S→B→E→G, cost = 4+1+1 = 6. But A* (w=1) would find S→A→D→F→G with cost = 1+1+2+1 = 5. Suboptimal by 1, but WA* expanded only 3 nodes vs A*'s 4. Error bound: 6 ≤ ${W}×5 = 10 ✓`,
    pathNodes: ["S", "B", "E", "G"],
    pathEdges: ["s-b", "b-e", "e-g"],
  },
];

function makeLabel(id: string, step: Step): string {
  const gVal = step.gScores[id];
  const hVal = H_VALUES[id];
  const fVal = step.fScores[id];
  const g = gVal !== undefined ? String(gVal) : "∞";
  const f = fVal !== undefined ? String(fVal) : "∞";

  if (id === "S") return `S (Start)\ng=${g}  h=${hVal}\nf=${f}`;
  if (id === "G") return `G (Goal)\ng=${g}  h=${hVal}\nf=${f}`;
  return `${id}\ng=${g}  h=${hVal}\nf=${f}`;
}

function buildElements(step: Step): ElementDefinition[] {
  const pathSet = new Set(step.pathNodes ?? []);
  const closedSet = new Set(step.closedList);
  const openSet = new Set(step.openList);

  const nodeElements: ElementDefinition[] = NODES.map((id) => {
    let type = "";
    if (id === "S") type = "start";
    else if (id === "G") type = "goal";
    else if (pathSet.has(id)) type = "path";
    else if (step.current === id) type = "current";
    else if (closedSet.has(id)) type = "explored";
    else if (openSet.has(id)) type = "frontier";

    return {
      data: { id, label: makeLabel(id, step), type },
      position: POSITIONS[id],
    };
  });

  const pathEdgeSet = new Set(step.pathEdges ?? []);
  const edgeElements: ElementDefinition[] = EDGES.map((e) => ({
    data: {
      id: e.id,
      source: e.from,
      target: e.to,
      label: `${e.cost}`,
      type: pathEdgeSet.has(e.id) ? "path" : "",
    },
  }));

  return [...nodeElements, ...edgeElements];
}

export default function WAStarViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const elements = buildElements(step);

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              WA* (w=2) Trace
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
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => i - 1)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={stepIdx === STEPS.length - 1}
              onClick={() => setStepIdx((i) => i + 1)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <CytoscapeGraph
        elements={elements}
        height={640}
        nodeWidth={130}
        nodeHeight={72}
        nodeFontSize={13}
        usePresetPositions
        layout={{ name: "preset" }}
        wide
      />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-green-400" style={{ backgroundColor: "#15803d" }} />
            <span className="text-foreground/50">Start / Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} />
            <span className="text-foreground/50">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-sky-400" style={{ backgroundColor: "#0369a1" }} />
            <span className="text-foreground/50">Frontier (Open)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-gray-400" style={{ backgroundColor: "#4b5563" }} />
            <span className="text-foreground/50">Explored (Closed)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-rose-400" style={{ backgroundColor: "#be123c" }} />
            <span className="text-foreground/50">Goal</span>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/65">
          {step.description}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Current</div>
            <div className="text-[13px] font-medium text-amber-600 dark:text-amber-400">{step.current}</div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Open List</div>
            <div className="text-[13px] font-medium text-sky-600 dark:text-sky-400">
              {step.openList.length > 0 ? step.openList.join(", ") : "— (empty)"}
            </div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Closed List</div>
            <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
              {step.closedList.length > 0 ? step.closedList.join(", ") : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
