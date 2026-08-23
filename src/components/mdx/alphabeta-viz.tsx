"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface ABStep {
  current: string | null;
  description: string;
  alpha: number;
  beta: number;
  solvedNodes: string[];
  prunedNodes: string[];
}

const POSITIONS: Record<string, { x: number; y: number }> = {
  A: { x: 390, y: 40 },
  B: { x: 120, y: 200 },
  C: { x: 390, y: 200 },
  D: { x: 660, y: 200 },
  L1: { x: 20, y: 360 },
  L2: { x: 130, y: 360 },
  L3: { x: 240, y: 360 },
  L4: { x: 320, y: 360 },
  L5: { x: 420, y: 360 },
  L6: { x: 520, y: 360 },
  L7: { x: 600, y: 360 },
  L8: { x: 700, y: 360 },
  L9: { x: 800, y: 360 },
};

const EDGES = [
  { source: "A", target: "B", id: "ab" },
  { source: "A", target: "C", id: "ac" },
  { source: "A", target: "D", id: "ad" },
  { source: "B", target: "L1", id: "b1" },
  { source: "B", target: "L2", id: "b2" },
  { source: "B", target: "L3", id: "b3" },
  { source: "C", target: "L4", id: "c4" },
  { source: "C", target: "L5", id: "c5" },
  { source: "C", target: "L6", id: "c6" },
  { source: "D", target: "L7", id: "d7" },
  { source: "D", target: "L8", id: "d8" },
  { source: "D", target: "L9", id: "d9" },
];

const LEAF_VALUES: Record<string, number> = {
  L1: 3, L2: 12, L3: 8, L4: 2, L5: 4, L6: 6, L7: 14, L8: 5, L9: 2,
};

const LABELS: Record<string, string> = {
  A: "A (MAX)",
  B: "B (MIN)",
  C: "C (MIN)",
  D: "D (MIN)",
};

const STEPS: ABStep[] = [
  {
    current: null,
    description:
      "Root A is a MAX node with three MIN children B, C, D. Start with the widest window: α = −∞, β = +∞. Descend left-to-right, depth-first.",
    alpha: Number.NEGATIVE_INFINITY,
    beta: Number.POSITIVE_INFINITY,
    solvedNodes: [],
    prunedNodes: [],
  },
  {
    current: "L1",
    description:
      "First leaf under B: value 3. As a MIN node, B can now guarantee at most 3 → set its provisional β = 3. Cutoff test: is β ≤ α (i.e., 3 ≤ −∞)? No — keep going.",
    alpha: Number.NEGATIVE_INFINITY,
    beta: 3,
    solvedNodes: ["L1"],
    prunedNodes: [],
  },
  {
    current: "L2",
    description:
      "Next sibling: 12. min(3, 12) = 3 — the opponent would never let you reach 12 here. B's value stays 3.",
    alpha: Number.NEGATIVE_INFINITY,
    beta: 3,
    solvedNodes: ["L1", "L2"],
    prunedNodes: [],
  },
  {
    current: "L3",
    description:
      "Last child: 8. B settles at min(3, 12, 8) = 3 and is solved. Back up to root: MAX updates α = max(−∞, 3) = 3. Any future branch must beat 3.",
    alpha: 3,
    beta: Number.POSITIVE_INFINITY,
    solvedNodes: ["L1", "L2", "L3", "B"],
    prunedNodes: [],
  },
  {
    current: "L4",
    description:
      "Now descend into C carrying the window (α=3, β=+∞). Its first child is 2! As MIN, C immediately drops to 2. Cutoff test: β ≤ α? Here β = 2 ≤ α = 3 — YES!",
    alpha: 3,
    beta: 2,
    solvedNodes: ["L1", "L2", "L3", "B"],
    prunedNodes: [],
  },
  {
    current: "L5",
    description:
      "PRUNED! C will never be chosen by A anyway: MAX already has 3 from B, and C can offer at most 2. Examining 4 and 6 is pointless — both are cut off without being looked at. C returns 2.",
    alpha: 3,
    beta: 2,
    solvedNodes: ["L1", "L2", "L3", "B"],
    prunedNodes: ["L5", "L6", "C"],
  },
  {
    current: "L7",
    description:
      "Descend into D with window (α=3, +∞). First child: 14. D's provisional value 14 > α, so keep exploring.",
    alpha: 3,
    beta: 14,
    solvedNodes: ["L1", "L2", "L3", "B"],
    prunedNodes: ["L5", "L6", "C"],
  },
  {
    current: "L8",
    description:
      "Child 5: min(14, 5) = 5. Still above α = 3, so D remains potentially interesting. Continue.",
    alpha: 3,
    beta: 5,
    solvedNodes: ["L1", "L2", "L3", "B"],
    prunedNodes: ["L5", "L6", "C"],
  },
  {
    current: "L9",
    description:
      "Last child: 2. min(5, 2) = 2 ≤ α = 3 — a cutoff would fire here too, but there are no siblings left. D = 2.",
    alpha: 3,
    beta: 2,
    solvedNodes: ["L1", "L2", "L3", "B"],
    prunedNodes: ["L5", "L6", "C"],
  },
  {
    current: "A",
    description:
      "Root backs up: max(3, 2, 2) = 3. Minimax value = 3, optimal move A → B. Alpha-beta examined 7 leaves instead of 9 — the two shaded leaves were never evaluated, yet the answer is EXACTLY what plain minimax would give.",
    alpha: 3,
    beta: 2,
    solvedNodes: ["L1", "L2", "L3", "B", "C", "D", "A"],
    prunedNodes: ["L5", "L6"],
  },
];

function fmt(v: number): string {
  if (v === Number.NEGATIVE_INFINITY) return "−∞";
  if (v === Number.POSITIVE_INFINITY) return "+∞";
  return String(v);
}

export default function AlphaBetaViz() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const solvedSet = new Set(step.solvedNodes);
  const prunedSet = new Set(step.prunedNodes);
  const currentSet = new Set(step.current ? [step.current] : []);

  const nodeElements: ElementDefinition[] = Object.keys(POSITIONS).map((id) => {
    let type = "";
    if (currentSet.has(id)) type = "current";
    else if (prunedSet.has(id)) type = "goal";
    else if (solvedSet.has(id)) type = "explored";
    const lbl = LEAF_VALUES[id] !== undefined ? `${id}: ${LEAF_VALUES[id]}` : LABELS[id];
    return { data: { id, label: lbl, type }, position: POSITIONS[id] };
  });

  const edgeElements: ElementDefinition[] = EDGES.map((e) => ({
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      type: prunedSet.has(e.target) || prunedSet.has(e.source) ? "path" : "",
    },
  }));

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              Alpha-Beta Trace
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
        height={460}
        nodeWidth={84}
        nodeHeight={56}
        nodeFontSize={11}
        usePresetPositions
        layout={{ name: "preset" }}
        wide
      />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} />
            <span className="text-foreground/50">Examining</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-gray-400" style={{ backgroundColor: "#4b5563" }} />
            <span className="text-foreground/50">Value finalized</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-rose-400" style={{ backgroundColor: "#be123c" }} />
            <span className="text-foreground/50">Pruned (never examined)</span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-foreground/65">{step.description}</p>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Window α</div>
            <div className="text-[13px] font-medium text-green-600 dark:text-green-400">{fmt(step.alpha)}</div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Window β</div>
            <div className="text-[13px] font-medium text-amber-600 dark:text-amber-400">{fmt(step.beta)}</div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Leaves Examined</div>
            <div className="text-[13px] font-medium text-sky-600 dark:text-sky-400">{step.solvedNodes.filter((n) => n.startsWith("L")).length} / 9</div>
          </div>
        </div>
      </div>
    </div>
  );
}
