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

const Q_NODES = ["P", "Q", "R", "T", "U", "V", "W", "Z"];

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
];

const Q_STEPS: QStep[] = [
  {
    current: "—",
    openList: ["P"],
    closedList: [],
    gScores: { P: 0 },
    fScores: { P: 9 },
    description: "Initialize: Open = {P(f=0+9=9)}. Closed = {}.",
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
    description: "Expand R → Q already in open with g=4, via R g=2+3=5 > 4, skip. U(g=2+5=7, f=7+3=10). Now Q(f=10) and U(f=10) tied. Pick Q (lower g).",
  },
  {
    current: "Q",
    openList: ["U", "T", "W"],
    closedList: ["P", "R", "Q"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14 },
    description: "Expand Q → T(g=4+3=7, f=7+4=11), W(g=4+5=9, f=9+5=14). U still f=10 (lowest).",
  },
  {
    current: "U",
    openList: ["T", "V", "W"],
    closedList: ["P", "R", "Q", "U"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9, V: 9 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14, V: 11 },
    description: "Expand U → V(g=7+2=9, f=9+2=11). T already in open with g=7, via U g=7+4=11 > 7, skip. T(f=11) lowest now.",
  },
  {
    current: "T",
    openList: ["V", "W"],
    closedList: ["P", "R", "Q", "U", "T"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9, V: 9 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14, V: 11 },
    description: "Expand T → V already in open with g=9, via T g=7+3=10 > 9, skip. Only V(f=11) and W(f=14) left. Pick V.",
  },
  {
    current: "V",
    openList: ["W", "Z"],
    closedList: ["P", "R", "Q", "U", "T", "V"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9, V: 9, Z: 12 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14, V: 11, Z: 12 },
    description: "Expand V → Z(g=9+3=12, f=12+0=12). W still f=14. Now Z(f=12) < W(f=14).",
  },
  {
    current: "Z",
    openList: ["W"],
    closedList: ["P", "R", "Q", "U", "T", "V", "Z"],
    gScores: { P: 0, Q: 4, R: 2, U: 7, T: 7, W: 9, V: 9, Z: 12 },
    fScores: { P: 9, Q: 10, R: 9, U: 10, T: 11, W: 14, V: 11, Z: 12 },
    description: "Z is the goal! Optimal path: P→R→U→V→Z, cost = 2+5+2+3 = 12. (Note: P→Q→T→V→Z also costs 4+3+3+3=13, NOT optimal.)",
    pathNodes: ["P", "R", "U", "V", "Z"],
    pathEdges: ["p-r", "r-u", "u-v", "v-z"],
  },
];

function buildQElements(step: QStep): ElementDefinition[] {
  const pathSet = new Set(step.pathNodes ?? []);
  const closedSet = new Set(step.closedList);
  const openSet = new Set(step.openList);

  const nodeElements: ElementDefinition[] = Q_NODES.map((id) => {
    let type = "";
    if (id === "P") type = "start";
    else if (id === "Z") type = "goal";
    if (pathSet.has(id) && id !== "P" && id !== "Z") type = "path";
    else if (step.current === id && id !== "P" && id !== "Z") type = "current";
    else if (closedSet.has(id) && id !== "P" && id !== "Z") type = "explored";
    else if (openSet.has(id) && id !== "P" && id !== "Z") type = "frontier";

    const gVal = step.gScores[id] ?? "∞";
    const hVal = Q_H[id];
    const fVal = step.fScores[id] ?? "∞";
    const label = `${id}\ng=${gVal} h=${hVal}\nf=${fVal}`;

    return { data: { id, label, type } };
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
    <div className="my-6 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/[0.03]">
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
                  onClick={() => setStepIdx((i) => i - 1)}
                  className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[12px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={stepIdx === Q_STEPS.length - 1}
                  onClick={() => setStepIdx((i) => i + 1)}
                  className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[12px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <CytoscapeGraph elements={elements} height={400} />

      {showSolution && (
        <div className="border-t border-amber-500/15 px-4 py-3">
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
