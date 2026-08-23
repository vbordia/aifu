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

const H_VALUES: Record<string, number> = { S: 10, A: 7, B: 5, C: 4, D: 3, E: 2, F: 1, G: 0 };

const EDGES = [
  { from: "S", to: "A", cost: 3, id: "s-a" },
  { from: "S", to: "B", cost: 5, id: "s-b" },
  { from: "S", to: "C", cost: 6, id: "s-c" },
  { from: "A", to: "D", cost: 4, id: "a-d" },
  { from: "A", to: "E", cost: 6, id: "a-e" },
  { from: "B", to: "E", cost: 3, id: "b-e" },
  { from: "B", to: "F", cost: 7, id: "b-f" },
  { from: "C", to: "F", cost: 5, id: "c-f" },
  { from: "C", to: "D", cost: 5, id: "c-d" },
  { from: "D", to: "G", cost: 5, id: "d-g" },
  { from: "E", to: "G", cost: 4, id: "e-g" },
  { from: "F", to: "G", cost: 3, id: "f-g" },
] as const;

const POSITIONS: Record<string, { x: number; y: number }> = {
  S: { x: 400, y: 60 },
  A: { x: 120, y: 220 },
  B: { x: 400, y: 220 },
  C: { x: 680, y: 220 },
  D: { x: 120, y: 400 },
  E: { x: 400, y: 400 },
  F: { x: 680, y: 400 },
  G: { x: 400, y: 560 },
};

const STEPS: Step[] = [
  {
    current: "—",
    openList: ["S"],
    closedList: [],
    gScores: { S: 0 },
    fScores: { S: 10 },
    description: "Start: Add S to open list. g(S)=0, h(S)=10, so f(S) = 0 + 10 = 10.",
  },
  {
    current: "S",
    openList: ["A", "B", "C"],
    closedList: ["S"],
    gScores: { S: 0, A: 3, B: 5, C: 6 },
    fScores: { S: 10, A: 10, B: 10, C: 10 },
    description: "Expand S → A(g=3, f=10), B(g=5, f=10), C(g=6, f=10). All tied at f=10! Break tie by lowest g → pick A (g=3).",
  },
  {
    current: "A",
    openList: ["B", "C", "D", "E"],
    closedList: ["S", "A"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 9 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 11 },
    description: "Expand A → D(g=7, f=10), E(g=9, f=11). B, C, D all have f=10. Pick B (lowest g among tied).",
  },
  {
    current: "B",
    openList: ["C", "D", "E", "F"],
    closedList: ["S", "A", "B"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 13 },
    description: "Expand B → E already in open with g=9, but via B: g=5+3=8 < 9, so UPDATE E(g=8, f=10). F(g=12, f=13). C, D, E all f=10. Pick C (lowest g).",
  },
  {
    current: "C",
    openList: ["D", "E", "F"],
    closedList: ["S", "A", "B", "C"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12 },
    description: "Expand C → D already g=7, via C g=11 > 7, skip. F via C g=6+5=11 < 12, UPDATE F(g=11, f=12). D and E both f=10. Pick D (lower g).",
  },
  {
    current: "D",
    openList: ["E", "F", "G"],
    closedList: ["S", "A", "B", "C", "D"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11, G: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12, G: 12 },
    description: "Expand D → G(g=12, f=12). E still has lowest f=10. Pick E.",
  },
  {
    current: "E",
    openList: ["F", "G"],
    closedList: ["S", "A", "B", "C", "D", "E"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11, G: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12, G: 12 },
    description: "Expand E → G already in open with g=12, via E g=8+4=12 (same), no update. F and G both f=12. Pick F (lower g).",
  },
  {
    current: "F",
    openList: ["G"],
    closedList: ["S", "A", "B", "C", "D", "E", "F"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11, G: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12, G: 12 },
    description: "Expand F → G already g=12, via F g=11+3=14 > 12, skip. Only G remains with f=12.",
  },
  {
    current: "G",
    openList: [],
    closedList: ["S", "A", "B", "C", "D", "E", "F", "G"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11, G: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12, G: 12 },
    description: "G is the goal! Optimal path: S → A → D → G, cost = 3 + 4 + 5 = 12. (Path S → B → E → G also costs 12 — both optimal!)",
    pathNodes: ["S", "A", "D", "G"],
    pathEdges: ["s-a", "a-d", "d-g"],
  },
];

function makeLabel(id: string, step: Step): string {
  const gVal = step.gScores[id];
  const hVal = H_VALUES[id];
  const fVal = step.fScores[id];
  const g = gVal !== undefined ? String(gVal) : "∞";
  const f = fVal !== undefined ? String(fVal) : "∞";

  if (id === "S") return `S (Start)\ng=${g}  h=${hVal}  f=${f}`;
  if (id === "G") return `G (Goal)\ng=${g}  h=${hVal}  f=${f}`;
  return `${id}\ng=${g}  h=${hVal}  f=${f}`;
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

export default function AStarViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const elements = buildElements(step);

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              A* Step-by-Step
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
        height={560}
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
