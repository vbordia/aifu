"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface Step {
  current: string;
  openList: string[];
  openMerits: string[];
  description: string;
  solvedNodes: string[];
  liveNodes: string[];
  prunedNodes: string[];
  solutionPath?: string[];
}

const NODES = ["A", "B", "C", "D", "E", "F", "G"] as const;

const POSITIONS: Record<string, { x: number; y: number }> = {
  A: { x: 400, y: 50 },
  B: { x: 200, y: 220 },
  C: { x: 600, y: 220 },
  D: { x: 100, y: 400 },
  E: { x: 300, y: 400 },
  F: { x: 500, y: 400 },
  G: { x: 700, y: 400 },
};

const LEAF_VALUES: Record<string, number> = { D: 3, E: 5, F: 6, G: 2 };
const NODE_TYPES: Record<string, string> = { A: "MAX", B: "MIN", C: "MIN", D: "leaf", E: "leaf", F: "leaf", G: "leaf" };
const PARENTS: Record<string, string> = { B: "A", C: "A", D: "B", E: "B", F: "C", G: "C" };
const SIBLINGS: Record<string, string[]> = { B: ["B", "C"], C: ["B", "C"], D: ["D", "E"], E: ["D", "E"], F: ["F", "G"], G: ["F", "G"] };

const EDGES = [
  { from: "A", to: "B", id: "a-b" },
  { from: "A", to: "C", id: "a-c" },
  { from: "B", to: "D", id: "b-d" },
  { from: "B", to: "E", id: "b-e" },
  { from: "C", to: "F", id: "c-f" },
  { from: "C", to: "G", id: "c-g" },
];

const STEPS: Step[] = [
  {
    current: "—",
    openList: ["A"],
    openMerits: ["∞"],
    description: "Initialize: OPEN = [(A, LIVE, ∞)]. A is the root MAX node.",
    solvedNodes: [],
    liveNodes: ["A"],
    prunedNodes: [],
  },
  {
    current: "A",
    openList: ["B", "C"],
    openMerits: ["∞", "∞"],
    description: "Pick (A, LIVE, ∞). A is MAX → insert ALL children: (B, LIVE, ∞), (C, LIVE, ∞).",
    solvedNodes: [],
    liveNodes: ["B", "C"],
    prunedNodes: [],
  },
  {
    current: "C",
    openList: ["B", "F"],
    openMerits: ["∞", "∞"],
    description: "Pick (C, LIVE, ∞). C is MIN → insert FIRST child only: (F, LIVE, ∞). B stays.",
    solvedNodes: [],
    liveNodes: ["B", "F"],
    prunedNodes: [],
  },
  {
    current: "F",
    openList: ["B"],
    openMerits: ["∞"],
    description: "Pick (F, LIVE, ∞). F is a leaf → SOLVED with value 6. OPEN = [(B, LIVE, ∞), (F, SOLVED, 6)].",
    solvedNodes: ["F"],
    liveNodes: ["B"],
    prunedNodes: [],
  },
  {
    current: "B",
    openList: ["G"],
    openMerits: ["6"],
    description: "Pick (F, SOLVED, 6). Parent C is MIN → C's merit = min(6, ∞) = 6. Not all children solved → insert next sibling (G, LIVE, 6). OPEN = [(B, LIVE, ∞), (G, LIVE, 6)]. But B has higher merit so pick B. Wait — pick highest merit: B(∞) > G(6). Expand B.",
    solvedNodes: ["F"],
    liveNodes: ["G", "D"],
    prunedNodes: [],
  },
  {
    current: "D",
    openList: ["G"],
    openMerits: ["6"],
    description: "B is MIN → insert first child (D, LIVE, ∞). Pick D (merit ∞ > 6).",
    solvedNodes: ["F"],
    liveNodes: ["G", "D"],
    prunedNodes: [],
  },
  {
    current: "E",
    openList: ["G", "E"],
    openMerits: ["6", "3"],
    description: "D is a leaf → SOLVED with value 3. Parent B is MIN → B's merit = min(3, ∞) = 3. Not all children solved → insert sibling (E, LIVE, 3).",
    solvedNodes: ["D", "F"],
    liveNodes: ["G", "E"],
    prunedNodes: [],
  },
  {
    current: "G",
    openList: ["E"],
    openMerits: ["3"],
    description: "Pick (G, LIVE, 6). G is a leaf → SOLVED with value 2. Parent C is MIN → C's merit = min(2, 6) = 2. All children of C solved → C is SOLVED with value 2.",
    solvedNodes: ["D", "F", "G", "C"],
    liveNodes: ["E"],
    prunedNodes: [],
  },
  {
    current: "E",
    openList: [],
    openMerits: [],
    description: "C is SOLVED with value 2. Parent A is MAX → A is SOLVED with value 2. All siblings of C (i.e., B) are PURGED from OPEN! But wait — B is still LIVE. SSS* purges B because MAX found a solution through C with value 2, and B's merit was 3 (min of children so far). Since B's merit ≥ A's solution, B cannot improve.",
    solvedNodes: ["D", "E", "F", "G", "C", "B", "A"],
    liveNodes: [],
    prunedNodes: ["B"],
    solutionPath: ["A", "C", "G"],
  },
];

function buildElements(step: Step): ElementDefinition[] {
  const solvedSet = new Set(step.solvedNodes);
  const liveSet = new Set(step.liveNodes);
  const prunedSet = new Set(step.prunedNodes);
  const pathSet = new Set(step.solutionPath ?? []);

  const nodeElements: ElementDefinition[] = NODES.map((id) => {
    let type = "";
    const isLeaf = id in LEAF_VALUES;

    if (pathSet.has(id)) type = "path";
    else if (prunedSet.has(id)) type = "explored";
    else if (step.current === id) type = "current";
    else if (solvedSet.has(id)) type = "start";
    else if (liveSet.has(id)) type = "frontier";

    const label: string = isLeaf
      ? `${id} = ${LEAF_VALUES[id]}`
      : `${id} (${NODE_TYPES[id]})`;

    return {
      data: { id, label, type },
      position: POSITIONS[id],
    };
  });

  const pathEdgeSet = new Set<string>();
  if (step.solutionPath) {
    for (let i = 0; i < step.solutionPath!.length - 1; i++) {
      const from = step.solutionPath![i].toLowerCase();
      const to = step.solutionPath![i + 1].toLowerCase();
      pathEdgeSet.add(`${from}-${to}`);
    }
  }

  const edgeElements: ElementDefinition[] = EDGES.map((e) => ({
    data: {
      id: e.id,
      source: e.from,
      target: e.to,
      type: pathEdgeSet.has(e.id) ? "path" : "",
    },
  }));

  return [...nodeElements, ...edgeElements];
}

export default function SSSStarViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const elements = buildElements(step);

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              SSS* Trace
            </span>
            <span className="text-[13px] font-medium text-foreground/70">
              Step {stepIdx} / {STEPS.length - 1}
            </span>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={stepIdx === 0} onClick={() => setStepIdx(0)} className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">Reset</button>
            <button type="button" disabled={stepIdx === 0} onClick={() => setStepIdx((i) => i - 1)} className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">← Prev</button>
            <button type="button" disabled={stepIdx === STEPS.length - 1} onClick={() => setStepIdx((i) => i + 1)} className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      </div>

      <CytoscapeGraph elements={elements} height={440} nodeWidth={100} nodeHeight={50} nodeFontSize={12} usePresetPositions layout={{ name: "preset" }} wide />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-green-400" style={{ backgroundColor: "#15803d" }} /><span className="text-foreground/50">Solved / Solution</span></div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} /><span className="text-foreground/50">Current</span></div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-sky-400" style={{ backgroundColor: "#0369a1" }} /><span className="text-foreground/50">LIVE (in OPEN)</span></div>
          <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border-2 border-gray-400" style={{ backgroundColor: "#4b5563" }} /><span className="text-foreground/50">Pruned</span></div>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/65">{step.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">OPEN List</div>
            <div className="text-[13px] font-medium text-sky-600 dark:text-sky-400">
              {step.openList.length > 0 ? step.openList.map((n, i) => `${n}(${step.openMerits[i]})`).join(", ") : "— (empty)"}
            </div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Solved Nodes</div>
            <div className="text-[13px] font-medium text-green-600 dark:text-green-400">
              {step.solvedNodes.length > 0 ? step.solvedNodes.join(", ") : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
