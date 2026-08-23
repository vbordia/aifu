"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

interface QStep {
  current: string;
  openList: string[];
  closedList: string[];
  gScores: Record<string, number>;
  fScores: Record<string, number>;
  description: string;
  pathNodes?: string[];
  pathEdges?: string[];
}

const Q_NODES = ["P", "Q", "R", "T", "U", "V", "W", "Z"] as const;

const Q_H: Record<string, number> = { P: 9, Q: 6, R: 7, T: 4, U: 3, V: 2, W: 5, Z: 0 };

const Q_EDGES = [
  { from: "P", to: "Q", cost: 4, id: "p-q" },
  { from: "P", to: "R", cost: 2, id: "p-r" },
  { from: "Q", to: "T", cost: 3, id: "q-t" },
  { from: "Q", to: "W", cost: 5, id: "q-w" },
  { from: "R", to: "U", cost: 5, id: "r-u" },
  { from: "R", to: "Q", cost: 3, id: "r-q" },
  { from: "T", to: "U", cost: 4, id: "t-u" },
  { from: "T", to: "V", cost: 3, id: "t-v" },
  { from: "U", to: "V", cost: 2, id: "u-v" },
  { from: "W", to: "Z", cost: 7, id: "w-z" },
  { from: "V", to: "Z", cost: 3, id: "v-z" },
] as const;

const Q_POSITIONS: Record<string, { x: number; y: number }> = {
  P: { x: 400, y: 60 },
  Q: { x: 160, y: 220 },
  R: { x: 640, y: 220 },
  T: { x: 80, y: 390 },
  W: { x: 280, y: 390 },
  U: { x: 640, y: 390 },
  V: { x: 400, y: 540 },
  Z: { x: 400, y: 700 },
};

const Q_STEPS: QStep[] = [
  {
    current: "—",
    openList: ["P"],
    closedList: [],
    gScores: { P: 0 },
    fScores: { P: 9 },
    description: "Initialize: Open = {P(f=0+9=9)}, Closed = {}.",
  },
  {
    current: "P",
    openList: ["R", "Q"],
    closedList: ["P"],
    gScores: { P: 0, Q: 4, R: 2 },
    fScores: { P: 9, Q: 10, R: 9 },
    description: "Expand P → Q(g=4, f=4+6=10), R(g=2, f=2+7=9). R has lowest f=9.",
  },
  {
    current: "R",
    openList: ["Q", "U"],
    closedList: ["P", "R"],
    gScores: { P: 0, Q: 4, R: 2, U: 7 },
    fScores: { P: 9, Q: 10, R: 9, U: 10 },
    description: "Expand R → Q already in open with g=4, via R g=2+3=5 > 4, skip. U(g=7, f=7+3=10). Q and U tied at f=10. Pick Q (lower g).",
  },
  {
    current: "Q",
    openList: ["U", "T", "W"],
    closedList: ["P", "R", "Q"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14 },
    description: "Expand Q → T(g=7, f=7+4=11), W(g=9, f=9+5=14). U still f=10 (lowest).",
  },
  {
    current: "U",
    openList: ["T", "V", "W"],
    closedList: ["P", "R", "Q", "U"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9, V: 9 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14, V: 11 },
    description: "Expand U → V(g=7+2=9, f=11). T already in open with g=7, via U g=11 > 7, skip. T(f=11) is now lowest.",
  },
  {
    current: "T",
    openList: ["V", "W"],
    closedList: ["P", "R", "Q", "U", "T"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9, V: 9 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14, V: 11 },
    description: "Expand T → V already g=9, via T g=7+3=10 > 9, skip. V(f=11) and W(f=14). Pick V.",
  },
  {
    current: "V",
    openList: ["W", "Z"],
    closedList: ["P", "R", "Q", "U", "T", "V"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9, V: 9, Z: 12 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14, V: 11, Z: 12 },
    description: "Expand V → Z(g=9+3=12, f=12). W still f=14. Z(f=12) < W(f=14).",
  },
  {
    current: "Z",
    openList: ["W"],
    closedList: ["P", "R", "Q", "U", "T", "V", "Z"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9, V: 9, Z: 12 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14, V: 11, Z: 12 },
    description: "Z is the goal! Optimal path: P → R → U → V → Z, cost = 2 + 5 + 2 + 3 = 12.",
    pathNodes: ["P", "R", "U", "V", "Z"],
    pathEdges: ["p-r", "r-u", "u-v", "v-z"],
  },
];

function makeQLabel(id: string, step: QStep): string {
  const gVal = step.gScores[id];
  const hVal = Q_H[id];
  const fVal = step.fScores[id];
  const g = gVal !== undefined ? String(gVal) : "∞";
  const f = fVal !== undefined ? String(fVal) : "∞";

  if (id === "P") return `P (Start)\ng=${g}  h=${hVal}  f=${f}`;
  if (id === "Z") return `Z (Goal)\ng=${g}  h=${hVal}  f=${f}`;
  return `${id}\ng=${g}  h=${hVal}  f=${f}`;
}

function buildQElements(step: QStep): ElementDefinition[] {
  const pathSet = new Set(step.pathNodes ?? []);
  const closedSet = new Set(step.closedList);
  const openSet = new Set(step.openList);

  const nodeElements: ElementDefinition[] = Q_NODES.map((id) => {
    let type = "";
    if (id === "P") type = "start";
    else if (id === "Z") type = "goal";
    else if (pathSet.has(id)) type = "path";
    else if (step.current === id) type = "current";
    else if (closedSet.has(id)) type = "explored";
    else if (openSet.has(id)) type = "frontier";

    return {
      data: { id, label: makeQLabel(id, step), type },
      position: Q_POSITIONS[id],
    };
  });

  const pathEdgeSet = new Set(step.pathEdges ?? []);
  const edgeElements: ElementDefinition[] = Q_EDGES.map((e) => ({
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

export default function AStarExamQuestion() {
  const [stepIdx, setStepIdx] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const step = Q_STEPS[stepIdx];
  const elements = buildQElements(step);

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-amber-500/20 lg:-mx-8">
      <div className="border-b border-amber-500/15 bg-amber-500/[0.06] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Exam Practice
            </span>
            <span className="text-[13px] font-medium text-foreground/70">
              {showSolution ? `Step ${stepIdx} / ${Q_STEPS.length - 1}` : "Try it yourself first!"}
            </span>
          </div>
          <div className="flex gap-2">
            {!showSolution ? (
              <button
                type="button"
                onClick={() => setShowSolution(true)}
                className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[12px] font-medium text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500/20"
              >
                Show Solution
              </button>
            ) : (
              <>
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
                  disabled={stepIdx === Q_STEPS.length - 1}
                  onClick={() => setStepIdx((i) => i + 1)}
                  className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <CytoscapeGraph
        elements={elements}
        height={700}
        nodeWidth={130}
        nodeHeight={72}
        nodeFontSize={13}
        usePresetPositions
        layout={{ name: "preset" }}
        wide
      />

      {showSolution && (
        <div className="border-t border-amber-500/15 px-4 py-3">
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
      )}

      {!showSolution && (
        <div className="border-t border-amber-500/15 px-4 py-3">
          <p className="text-[13px] leading-relaxed text-foreground/55">
            Work through A* step-by-step on paper, then click &quot;Show Solution&quot; to verify your answer.
          </p>
        </div>
      )}
    </div>
  );
}
