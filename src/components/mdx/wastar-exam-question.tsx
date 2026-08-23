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

const Q_NODES = ["P", "Q", "R", "T", "S", "U", "Z"] as const;

const Q_H: Record<string, number> = { P: 7, Q: 5, R: 6, T: 3, S: 2, U: 1, Z: 0 };

const W = 2;

const Q_EDGES = [
  { from: "P", to: "Q", cost: 2, id: "p-q" },
  { from: "P", to: "R", cost: 1, id: "p-r" },
  { from: "Q", to: "T", cost: 1, id: "q-t" },
  { from: "R", to: "S", cost: 3, id: "r-s" },
  { from: "S", to: "U", cost: 1, id: "s-u" },
  { from: "S", to: "T", cost: 4, id: "s-t" },
  { from: "T", to: "Z", cost: 5, id: "t-z" },
  { from: "U", to: "Z", cost: 1, id: "u-z" },
] as const;

const Q_POSITIONS: Record<string, { x: number; y: number }> = {
  P: { x: 400, y: 50 },
  Q: { x: 160, y: 210 },
  R: { x: 640, y: 210 },
  T: { x: 280, y: 390 },
  S: { x: 640, y: 390 },
  U: { x: 640, y: 550 },
  Z: { x: 400, y: 710 },
};

const Q_STEPS: QStep[] = [
  {
    current: "—",
    openList: ["P"],
    closedList: [],
    gScores: { P: 0 },
    fScores: { P: 14 },
    description: `Initialize: Open = {P(f=0+${W}×7=14)}. Closed = {}. Weight w = ${W}.`,
  },
  {
    current: "P",
    openList: ["Q", "R"],
    closedList: ["P"],
    gScores: { P: 0, Q: 2, R: 1 },
    fScores: { P: 14, Q: 12, R: 13 },
    description: `Expand P → Q(g=2, f=2+${W}×5=12), R(g=1, f=1+${W}×6=13). With w=${W}, Q looks better because h=5 inflates to 10, making f=12. But A* (w=1) would tie at f=7 and pick R. Pick Q.`,
  },
  {
    current: "Q",
    openList: ["T", "R"],
    closedList: ["P", "Q"],
    gScores: { P: 0, Q: 2, R: 1, T: 3 },
    fScores: { P: 14, Q: 12, R: 13, T: 9 },
    description: `Expand Q → T(g=3, f=3+${W}×3=9). T has low h=3, so WA* rushes toward it. Pick T (f=9).`,
  },
  {
    current: "T",
    openList: ["Z", "R"],
    closedList: ["P", "Q", "T"],
    gScores: { P: 0, Q: 2, R: 1, T: 3, Z: 8 },
    fScores: { P: 14, Q: 12, R: 13, T: 9, Z: 8 },
    description: `Expand T → Z(g=8, f=8). Z has lowest f. Pick Z!`,
  },
  {
    current: "Z",
    openList: ["R"],
    closedList: ["P", "Q", "T", "Z"],
    gScores: { P: 0, Q: 2, R: 1, T: 3, Z: 8 },
    fScores: { P: 14, Q: 12, R: 13, T: 9, Z: 8 },
    description: `Z is the goal! WA* path: P→Q→T→Z, cost = 2+1+5 = 8. A* would find P→R→S→U→Z, cost = 1+3+1+1 = 6. Suboptimal by 2! Error bound: 8 ≤ ${W}×6 = 12 ✓`,
    pathNodes: ["P", "Q", "T", "Z"],
    pathEdges: ["p-q", "q-t", "t-z"],
  },
];

function makeQLabel(id: string, step: QStep): string {
  const gVal = step.gScores[id];
  const hVal = Q_H[id];
  const fVal = step.fScores[id];
  const g = gVal !== undefined ? String(gVal) : "∞";
  const f = fVal !== undefined ? String(fVal) : "∞";

  if (id === "P") return `P (Start)\ng=${g}  h=${hVal}\nf=${f}`;
  if (id === "Z") return `Z (Goal)\ng=${g}  h=${hVal}\nf=${f}`;
  return `${id}\ng=${g}  h=${hVal}\nf=${f}`;
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

export default function WAStarExamQuestion() {
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
            Trace WA* with w=2 on paper, then click &quot;Show Solution&quot; to verify. Compare with A* — does WA* find the same path?
          </p>
        </div>
      )}
    </div>
  );
}
