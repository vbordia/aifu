"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface MMStep {
  current: string | null;
  description: string;
  solvedNodes: string[];
  values: Record<string, number | null>;
  activeBranch?: string[];
}

const POSITIONS: Record<string, { x: number; y: number }> = {
  A: { x: 400, y: 40 },
  B: { x: 200, y: 190 },
  C: { x: 600, y: 190 },
  D: { x: 80, y: 340 },
  E: { x: 240, y: 340 },
  F: { x: 480, y: 340 },
  G: { x: 640, y: 340 },
};

const EDGES = [
  { source: "A", target: "B", id: "m-ab" },
  { source: "A", target: "C", id: "m-ac" },
  { source: "B", target: "D", id: "m-bd" },
  { source: "B", target: "E", id: "m-be" },
  { source: "C", target: "F", id: "m-cf" },
  { source: "C", target: "G", id: "m-cg" },
];

const LEAVES: Record<string, number> = { D: 3, E: 5, F: 6, G: 2 };

const STEPS: MMStep[] = [
  {
    current: null,
    description:
      "A is the MAX node (your move). Its children B and C are MIN nodes (opponent's replies). Leaves carry static evaluation values. Goal: back values up to A.",
    solvedNodes: [],
    values: { A: null, B: null, C: null, D: 3, E: 5, F: 6, G: 2 },
  },
  {
    current: "D",
    description:
      "Depth-first left-to-right. Leaf D evaluates to 3.",
    solvedNodes: ["D"],
    values: { A: null, B: null, C: null, D: 3, E: 5, F: 6, G: 2 },
  },
  {
    current: "E",
    description:
      "Leaf E evaluates to 5.",
    solvedNodes: ["D", "E"],
    values: { A: null, B: null, C: null, D: 3, E: 5, F: 6, G: 2 },
  },
  {
    current: "B",
    description:
      "All of B's children are known: min(3, 5) = 3. MIN node B backs up value 3 — it's the opponent's best reply in that branch.",
    solvedNodes: ["D", "E", "B"],
    values: { A: null, B: 3, C: null, D: 3, E: 5, F: 6, G: 2 },
    activeBranch: ["A", "B"],
  },
  {
    current: "F",
    description:
      "Move to the right subtree. Leaf F evaluates to 6.",
    solvedNodes: ["D", "E", "B", "F"],
    values: { A: null, B: 3, C: null, D: 3, E: 5, F: 6, G: 2 },
  },
  {
    current: "G",
    description:
      "Leaf G evaluates to 2.",
    solvedNodes: ["D", "E", "B", "F", "G"],
    values: { A: null, B: 3, C: null, D: 3, E: 5, F: 6, G: 2 },
  },
  {
    current: "C",
    description:
      "min(6, 2) = 2. MIN node C backs up value 2.",
    solvedNodes: ["D", "E", "B", "F", "G", "C"],
    values: { A: null, B: 3, C: 2, D: 3, E: 5, F: 6, G: 2 },
  },
  {
    current: "A",
    description:
      "MAX at root: max(3, 2) = 3. The minimax value of the game is 3 and the optimal move is A → B. Notice: B's backed-up value came from its WORST child (D=3), because a perfect opponent would push you there.",
    solvedNodes: ["D", "E", "B", "F", "G", "C", "A"],
    values: { A: 3, B: 3, C: 2, D: 3, E: 5, F: 6, G: 2 },
    activeBranch: ["A", "B", "D"],
  },
];

function label(id: string, v: number | null): string {
  const base = LEAVES[id] !== undefined ? `${id} = ${LEAVES[id]}` : id;
  return base;
}

export default function MinimaxViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const solvedSet = new Set(step.solvedNodes);
  const currentSet = new Set(step.current ? [step.current] : []);
  const branchEdges = new Set(
    (step.activeBranch ?? []).slice(0, -1).map((n, i) => `${n}-${(step.activeBranch ?? [])[i + 1]}`)
  );

  const nodeElements: ElementDefinition[] = Object.keys(POSITIONS).map((id) => {
    let type = "";
    if (currentSet.has(id)) type = "current";
    else if (solvedSet.has(id)) type = "explored";
    return { data: { id, label: label(id, step.values[id] ?? null), type }, position: POSITIONS[id] };
  });

  const edgeElements: ElementDefinition[] = EDGES.map((e) => ({
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      type: branchEdges.has(`${e.source}${e.target}`) ? "path" : "",
    },
  }));

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              Minimax Backup
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
        nodeWidth={80}
        nodeHeight={60}
        nodeFontSize={13}
        usePresetPositions
        layout={{ name: "preset" }}
      />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} />
            <span className="text-foreground/50">Currently backing up</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-gray-400" style={{ backgroundColor: "#4b5563" }} />
            <span className="text-foreground/50">Value finalized</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-green-400" style={{ backgroundColor: "#15803d" }} />
            <span className="text-foreground/50">Optimal line</span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-foreground/65">{step.description}</p>

        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {(["A", "B", "C", "D", "E", "F", "G"] as const).map((id) => (
            <div key={id} className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-2 py-1.5 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{id}</div>
              <div className={`text-[13px] font-medium ${step.values[id] === null ? "text-foreground/30" : "text-green-600 dark:text-green-400"}`}>
                {step.values[id] === null ? "?" : step.values[id]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
