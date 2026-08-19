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

const NODES = ["S", "A", "B", "C", "D", "E", "F", "G"];

const H_VALUES: Record<string, number> = { S: 10, A: 7, B: 5, C: 4, D: 3, E: 2, F: 1, G: 0 };

const EDGES: { from: string; to: string; cost: number; id: string }[] = [
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
];

const STEPS: Step[] = [
  {
    current: "—",
    openList: ["S"],
    closedList: [],
    gScores: { S: 0 },
    fScores: { S: 10 },
    description: "Start: Open list = {S}, g(S)=0, h(S)=10, f(S)=0+10=10",
  },
  {
    current: "S",
    openList: ["A", "B", "C"],
    closedList: ["S"],
    gScores: { S: 0, A: 3, B: 5, C: 6 },
    fScores: { S: 10, A: 10, B: 10, C: 10 },
    description: "Expand S → neighbors A(f=3+7=10), B(f=5+5=10), C(f=6+4=10). All tied at f=10! Pick A (lowest g).",
  },
  {
    current: "A",
    openList: ["B", "C", "D", "E"],
    closedList: ["S", "A"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 9 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 11 },
    description: "Expand A → neighbors D(g=3+4=7, f=7+3=10), E(g=3+6=9, f=9+2=11). D has f=10, E has f=11. Pick B (f=10, tie-break by g).",
  },
  {
    current: "B",
    openList: ["C", "D", "E", "F"],
    closedList: ["S", "A", "B"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 13 },
    description: "Expand B → E already in open with g=9 but via B g=5+3=8 < 9, update E(g=8,f=10). F(g=5+7=12, f=13). Now C and D both f=10. Pick C.",
  },
  {
    current: "C",
    openList: ["D", "E", "F"],
    closedList: ["S", "A", "B", "C"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12 },
    description: "Expand C → D already g=7, via C g=6+5=11 > 7, skip. F via C g=6+5=11, f=12 < 13, update F. Pick D (f=10).",
  },
  {
    current: "D",
    openList: ["E", "F", "G"],
    closedList: ["S", "A", "B", "C", "D"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11, G: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12, G: 12 },
    description: "Expand D → G(g=7+5=12, f=12). Now E has f=10 (lowest). Pick E.",
  },
  {
    current: "E",
    openList: ["F", "G"],
    closedList: ["S", "A", "B", "C", "D", "E"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11, G: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12, G: 12 },
    description: "Expand E → G already in open with g=12, via E g=8+4=12, same cost. No update. Now F and G both f=12. Pick F (lower h).",
  },
  {
    current: "F",
    openList: ["G"],
    closedList: ["S", "A", "B", "C", "D", "E", "F"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11, G: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12, G: 12 },
    description: "Expand F → G already in open with g=12, via F g=11+3=14 > 12, skip. Only G remains in open.",
  },
  {
    current: "G",
    openList: [],
    closedList: ["S", "A", "B", "C", "D", "E", "F", "G"],
    gScores: { S: 0, A: 3, B: 5, C: 6, D: 7, E: 8, F: 11, G: 12 },
    fScores: { S: 10, A: 10, B: 10, C: 10, D: 10, E: 10, F: 12, G: 12 },
    description: "G is the goal! Optimal path: S→A→D→G with cost 12. (Also S→B→E→G costs 12 — both optimal!)",
    pathNodes: ["S", "A", "D", "G"],
    pathEdges: ["s-a", "a-d", "d-g"],
  },
];

function buildElements(step: Step): ElementDefinition[] {
  const pathSet = new Set(step.pathNodes ?? []);
  const closedSet = new Set(step.closedList);
  const openSet = new Set(step.openList);

  const nodeElements: ElementDefinition[] = NODES.map((id) => {
    let type = "";
    if (id === "S") type = "start";
    else if (id === "G") type = "goal";
    if (pathSet.has(id) && id !== "S" && id !== "G") type = "path";
    else if (step.current === id && id !== "S" && id !== "G") type = "current";
    else if (closedSet.has(id) && id !== "S" && id !== "G") type = "explored";
    else if (openSet.has(id) && id !== "S" && id !== "G") type = "frontier";

    const gVal = step.gScores[id] ?? "∞";
    const hVal = H_VALUES[id];
    const fVal = step.fScores[id] ?? "∞";
    const label = `${id}\ng=${gVal} h=${hVal}\nf=${fVal}`;

    return {
      data: { id, label, type },
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
    <div className="my-6 overflow-hidden rounded-xl border border-foreground/[0.1] bg-foreground/[0.02]">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              A* Trace
            </span>
            <span className="text-[13px] font-medium text-foreground/70">
              Step {stepIdx} / {STEPS.length - 1}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => i - 1)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[12px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={stepIdx === STEPS.length - 1}
              onClick={() => setStepIdx((i) => i + 1)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[12px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <CytoscapeGraph elements={elements} height={420} />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-4 text-[12px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-green-500" />
            <span className="text-foreground/50">Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-red-500" />
            <span className="text-foreground/50">Goal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-amber-500" />
            <span className="text-foreground/50">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-sky-500" />
            <span className="text-foreground/50">Frontier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-gray-500" />
            <span className="text-foreground/50">Explored</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
            <span className="text-foreground/50">Optimal Path</span>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/65">
          {step.description}
        </p>
      </div>
    </div>
  );
}
