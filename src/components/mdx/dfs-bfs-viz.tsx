"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

type Algorithm = "dfs" | "bfs";

interface SearchStep {
  current: string | null;
  description: string;
  open: string[];
  closed: string[];
  frontierNodes: string[];
  visitedNodes: string[];
  pathNodes?: string[];
}

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  S: { x: 400, y: 40 },
  A: { x: 150, y: 180 },
  B: { x: 400, y: 180 },
  D: { x: 650, y: 180 },
  C: { x: 150, y: 330 },
  E: { x: 650, y: 330 },
  G: { x: 400, y: 470 },
};

const EDGES = [
  { source: "S", target: "A", id: "e-sa" },
  { source: "S", target: "B", id: "e-sb" },
  { source: "S", target: "D", id: "e-sd" },
  { source: "A", target: "C", id: "e-ac" },
  { source: "A", target: "B", id: "e-ab" },
  { source: "A", target: "S", id: "e-as" },
  { source: "B", target: "D", id: "e-bd" },
  { source: "B", target: "A", id: "e-ba" },
  { source: "B", target: "S", id: "e-bs" },
  { source: "C", target: "G", id: "e-cg" },
  { source: "C", target: "A", id: "e-ca" },
  { source: "C", target: "B", id: "e-cb" },
  { source: "D", target: "E", id: "e-de" },
  { source: "D", target: "G", id: "e-dg" },
  { source: "D", target: "B", id: "e-db" },
  { source: "D", target: "S", id: "e-ds" },
  { source: "E", target: "D", id: "e-ed" },
];

const DFS_STEPS: SearchStep[] = [
  {
    current: null,
    description:
      "Initialize: Open = [(S, nil)], Closed = []. S is the start state.",
    open: ["S"],
    closed: [],
    frontierNodes: ["S"],
    visitedNodes: [],
  },
  {
    current: "S",
    description:
      "Pick S (head of Open). Not the goal — move to Closed. MoveGen(S) gives [A, B, D]. None seen before, so add all three at the HEAD of Open (stack behavior).",
    open: ["A", "B", "D"],
    closed: ["S"],
    frontierNodes: ["A", "B", "D"],
    visitedNodes: ["S"],
  },
  {
    current: "A",
    description:
      "Pick A — the newest node. DFS dives deep! Closed = [S, A]. MoveGen(A) = [C, B, S]. B is already on Open, S is on Closed — only C is genuinely new. Add C at the head.",
    open: ["C", "B", "D"],
    closed: ["S", "A"],
    frontierNodes: ["C", "B", "D"],
    visitedNodes: ["S", "A"],
  },
  {
    current: "C",
    description:
      "Still going deeper along one branch. Pick C. MoveGen(C) = [G, A, B] — only G is new. Add G at the head of Open.",
    open: ["G", "B", "D"],
    closed: ["S", "A", "C"],
    frontierNodes: ["G", "B", "D"],
    visitedNodes: ["S", "A", "C"],
  },
  {
    current: "G",
    description:
      "Pick G — GoalTest(G) returns TRUE! Trace parent pointers back: G ← C ← A ← S. Path found: S → A → C → G. Notice: this path has length 3 — NOT the shortest (S → D → G has length 2). This is the price of diving deep blindly.",
    open: ["B", "D"],
    closed: ["S", "A", "C", "G"],
    frontierNodes: ["B", "D"],
    visitedNodes: ["S", "A", "C", "G"],
    pathNodes: ["S", "A", "C", "G"],
  },
];

const BFS_STEPS: SearchStep[] = [
  {
    current: null,
    description:
      "Initialize: Open = [(S, nil)], Closed = []. Same starting point as DFS — the ONLY difference is where new nodes go in the queue below.",
    open: ["S"],
    closed: [],
    frontierNodes: ["S"],
    visitedNodes: [],
  },
  {
    current: "S",
    description:
      "Pick S from Open. Not the goal — move to Closed. MoveGen(S) = [A, B, D]. Add all three at the TAIL of Open (queue behavior).",
    open: ["A", "B", "D"],
    closed: ["S"],
    frontierNodes: ["A", "B", "D"],
    visitedNodes: ["S"],
  },
  {
    current: "A",
    description:
      "Pick A — the OLDEST node, not the newest. BFS sweeps level by level. MoveGen(A) = [C, B, S]: only C is new. Add C at the tail. Note B and D are still waiting — BFS does not dive into C yet.",
    open: ["B", "D", "C"],
    closed: ["S", "A"],
    frontierNodes: ["B", "D", "C"],
    visitedNodes: ["S", "A"],
  },
  {
    current: "B",
    description:
      "Pick B. MoveGen(B) = [D, A, S] — D is on Open, A and S on Closed. Nothing new to add. BFS stays at distance ≤ 1 from S.",
    open: ["D", "C"],
    closed: ["S", "A", "B"],
    frontierNodes: ["D", "C"],
    visitedNodes: ["S", "A", "B"],
  },
  {
    current: "D",
    description:
      "Pick D. MoveGen(D) = [E, G, B, S] — E and G are new. Add both at the tail. G has entered Open at depth 2!",
    open: ["C", "E", "G"],
    closed: ["S", "A", "B", "D"],
    frontierNodes: ["C", "E", "G"],
    visitedNodes: ["S", "A", "B", "D"],
  },
  {
    current: "C",
    description:
      "Finish level 2 first: pick C. MoveGen(C) = [G, A, B] — G is on Open, rest are closed. Nothing new. BFS refuses to jump to G even though it is sitting right there in Open.",
    open: ["E", "G"],
    closed: ["S", "A", "B", "D", "C"],
    frontierNodes: ["E", "G"],
    visitedNodes: ["S", "A", "B", "D", "C"],
  },
  {
    current: "E",
    description:
      "Pick E. MoveGen(E) = [D] — already closed. Nothing new.",
    open: ["G"],
    closed: ["S", "A", "B", "D", "C", "E"],
    frontierNodes: ["G"],
    visitedNodes: ["S", "A", "B", "D", "C", "E"],
  },
  {
    current: "G",
    description:
      "Pick G — GoalTest(G) returns TRUE! Trace parents: G ← D ← S. Path found: S → D → G, length 2 — the SHORTEST possible. Because BFS processes nodes in increasing distance from S, the first time it touches a goal, that path must be shortest.",
    open: [],
    closed: ["S", "A", "B", "D", "C", "E", "G"],
    frontierNodes: [],
    visitedNodes: ["S", "A", "B", "D", "C", "E", "G"],
    pathNodes: ["S", "D", "G"],
  },
];

function formatPairs(algo: Algorithm, list: string[]): string {
  if (list.length === 0) return "[]";
  return `[${list.map((n) => `(${n}, ·)`).join(", ")}]`;
}

export default function DFSBFSViz() {
  const [algo, setAlgo] = useState<Algorithm>("dfs");
  const [stepIdx, setStepIdx] = useState(0);

  const steps = algo === "dfs" ? DFS_STEPS : BFS_STEPS;
  const step = steps[Math.min(stepIdx, steps.length - 1)];

  const switchAlgo = (next: Algorithm) => {
    setAlgo(next);
    setStepIdx(0);
  };

  const pathSet = new Set(step.pathNodes ?? []);
  const currentSet = new Set(step.current ? [step.current] : []);
  const frontierSet = new Set(step.frontierNodes.filter((n) => !currentSet.has(n) && !pathSet.has(n)));
  const visitedSet = new Set(step.visitedNodes.filter((n) => !pathSet.has(n)));

  const nodeElements: ElementDefinition[] = Object.keys(NODE_POSITIONS).map((id) => {
    let type = "";
    if (pathSet.has(id)) type = "path";
    else if (currentSet.has(id)) type = "current";
    else if (frontierSet.has(id)) type = "frontier";
    else if (visitedSet.has(id)) type = "explored";
    return { data: { id, label: id, type }, position: NODE_POSITIONS[id] };
  });

  const edgeElements: ElementDefinition[] = EDGES.map((e) => ({
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      type: pathSet.has(e.source) && pathSet.has(e.target) ? "path" : "",
    },
  }));

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              Blind Search Trace
            </span>
            <span className="text-[13px] font-medium text-foreground/70">
              Step {stepIdx} / {steps.length - 1}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => switchAlgo("dfs")}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                algo === "dfs"
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "border-foreground/[0.1] bg-foreground/[0.03] text-foreground/60 hover:bg-foreground/[0.08]"
              }`}
            >
              DFS
            </button>
            <button
              type="button"
              onClick={() => switchAlgo("bfs")}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                algo === "bfs"
                  ? "border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                  : "border-foreground/[0.1] bg-foreground/[0.03] text-foreground/60 hover:bg-foreground/[0.08]"
              }`}
            >
              BFS
            </button>
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
              disabled={stepIdx >= steps.length - 1}
              onClick={() => setStepIdx((i) => i + 1)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <CytoscapeGraph
        key={algo}
        elements={[...nodeElements, ...edgeElements]}
        height={480}
        nodeWidth={64}
        nodeHeight={64}
        nodeFontSize={16}
        usePresetPositions
        layout={{ name: "preset" }}
      />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-amber-400" style={{ backgroundColor: "#b45309" }} />
            <span className="text-foreground/50">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-sky-400" style={{ backgroundColor: "#0369a1" }} />
            <span className="text-foreground/50">On Open (frontier)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-gray-400" style={{ backgroundColor: "#4b5563" }} />
            <span className="text-foreground/50">Closed (visited)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border-2 border-green-400" style={{ backgroundColor: "#15803d" }} />
            <span className="text-foreground/50">Path to Goal</span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-foreground/65">{step.description}</p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Open {algo === "dfs" ? "(stack — add at head)" : "(queue — add at tail)"}
            </div>
            <div className={`font-mono text-[12px] leading-relaxed ${algo === "dfs" ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400"}`}>
              {formatPairs(algo, step.open)}
            </div>
          </div>
          <div className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Closed</div>
            <div className="font-mono text-[12px] leading-relaxed text-foreground/60">[{step.closed.join(", ")}]</div>
          </div>
        </div>
      </div>
    </div>
  );
}
