"use client";

import { useMemo, useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";

const ORIGINAL: Record<string, number> = {
  A: 18, B: 69, C: 30, D: 53,
  E: 15, F: 27, G: 98, H: 14,
  I: 19, J: 37, K: 61, L: 68,
};

const LEAVES = Object.keys(ORIGINAL);

const PAIRS: Array<[string, string]> = [
  ["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"], ["K", "L"],
];

const M_NODES = ["M11", "M12", "M21", "M22", "M31", "M32"];
const N_NODES = ["N1", "N2", "N3"];

const POSITIONS: Record<string, { x: number; y: number }> = {
  R: { x: 600, y: 40 },
  N1: { x: 200, y: 160 },
  N2: { x: 600, y: 160 },
  N3: { x: 1000, y: 160 },
  M11: { x: 100, y: 290 }, M12: { x: 300, y: 290 },
  M21: { x: 500, y: 290 }, M22: { x: 700, y: 290 },
  M31: { x: 900, y: 290 }, M32: { x: 1100, y: 290 },
  A: { x: 50, y: 420 }, B: { x: 150, y: 420 },
  C: { x: 250, y: 420 }, D: { x: 350, y: 420 },
  E: { x: 450, y: 420 }, F: { x: 550, y: 420 },
  G: { x: 650, y: 420 }, H: { x: 750, y: 420 },
  I: { x: 850, y: 420 }, J: { x: 950, y: 420 },
  K: { x: 1050, y: 420 }, L: { x: 1150, y: 420 },
};

const EDGES = [
  ["R", "N1"], ["R", "N2"], ["R", "N3"],
  ["N1", "M11"], ["N1", "M12"],
  ["N2", "M21"], ["N2", "M22"],
  ["N3", "M31"], ["N3", "M32"],
  ["M11", "A"], ["M11", "B"],
  ["M12", "C"], ["M12", "D"],
  ["M21", "E"], ["M21", "F"],
  ["M22", "G"], ["M22", "H"],
  ["M31", "I"], ["M31", "J"],
  ["M32", "K"], ["M32", "L"],
] as const;

export default function MinimaxTweakViz() {
  const [vals, setVals] = useState<Record<string, number>>({ ...ORIGINAL });
  const [selected, setSelected] = useState<string | null>(null);
  const target = 98;

  const computed = useMemo(() => {
    const m: Record<string, number> = {};
    PAIRS.forEach(([l, r], i) => {
      m[M_NODES[i]] = Math.max(vals[l], vals[r]);
    });
    const n: Record<string, number> = {};
    n.N1 = Math.min(m.M11, m.M12);
    n.N2 = Math.min(m.M21, m.M22);
    n.N3 = Math.min(m.M31, m.M32);
    const root = Math.max(n.N1, n.N2, n.N3);
    return { m, n, root };
  }, [vals]);

  const changedLeaves = LEAVES.filter((l) => vals[l] !== ORIGINAL[l]);
  const changedSet = new Set(changedLeaves);
  const selectedSet = new Set(selected ? [selected] : []);

  let successPath = new Set<string>();
  if (computed.root === target) {
    const bestN = N_NODES.find((n) => computed.n[n] === target)!;
    const pairIdx = bestN === "N1" ? [0, 1] : bestN === "N2" ? [2, 3] : [4, 5];
    successPath = new Set<string>(["R", bestN, ...pairIdx.map((i) => M_NODES[i]), ...PAIRS[pairIdx[0]], ...PAIRS[pairIdx[1]]]);
  }

  const nodeElements: ElementDefinition[] = [
    ...Object.keys(POSITIONS).map((id) => {
      let label = id;
      let type = "";
      if (LEAVES.includes(id)) {
        label = `${id}: ${vals[id]}`;
        if (selectedSet.has(id)) type = "current";
        else if (changedSet.has(id)) type = "frontier";
        else if (successPath.has(id)) type = "path";
      } else if (M_NODES.includes(id)) {
        label = `${id}\nmax = ${computed.m[id]}`;
        if (successPath.has(id)) type = "path";
      } else if (N_NODES.includes(id)) {
        label = `${id} (MIN)\nmin = ${computed.n[id]}`;
        if (successPath.has(id)) type = "path";
      } else {
        label = `Root (MAX)\n= ${computed.root}`;
        if (computed.root === target) type = "path";
      }
      return { data: { id, label, type }, position: POSITIONS[id] };
    }),
  ];

  const edgeElements: ElementDefinition[] = EDGES.map(([s, t]) => ({
    data: {
      id: `${s}-${t}`,
      source: s,
      target: t,
      type: successPath.has(s) && successPath.has(t) ? "path" : "",
    },
  }));

  const tweak = (delta: number) => {
    if (!selected) return;
    setVals((v) => ({ ...v, [selected]: v[selected] + delta }));
  };

  const baseMsg = selected
    ? `Selected leaf ${selected} (currently ${vals[selected]}). Use the buttons above to change its eval and watch the backed-up values update live.`
    : "Click a leaf node to select it, then use the buttons above to change its eval.";

  let message: string;
  if (computed.root === target) {
    message =
      changedLeaves.length === 1
        ? `${baseMsg} Success with exactly ONE leaf changed (${changedLeaves[0]}: ${ORIGINAL[changedLeaves[0]]} to ${vals[changedLeaves[0]]}). Try nudging by 1 to find the smallest value that still works — that boundary is what exams ask for.`
        : `${baseMsg} Root is now ${target}, but you changed ${changedLeaves.length} leaves. Exams allow only ONE change — can you do it with a single leaf?`;
  } else {
    message = `${baseMsg} Currently Root = max(${computed.n.N1}, ${computed.n.N2}, ${computed.n.N3}) = ${computed.root}.`;
  }

  return (
    <div className="-mx-4 my-6 overflow-hidden rounded-xl border border-foreground/[0.1] lg:-mx-8">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              Force the Minimax Value
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                computed.root === target
                  ? "bg-green-500/15 text-green-700 dark:text-green-400"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              }`}
            >
              Target = {target} · Current = {computed.root}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!selected}
              onClick={() => tweak(-10)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              −10
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => tweak(-1)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              −1
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => tweak(1)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              +1
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => tweak(10)}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              +10
            </button>
            <button
              type="button"
              onClick={() => setVals({ ...ORIGINAL })}
              className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08]"
            >
              Reset tree
            </button>
          </div>
        </div>
      </div>

      <CytoscapeGraph
        elements={[...nodeElements, ...edgeElements]}
        height={520}
        nodeWidth={84}
        nodeHeight={58}
        nodeFontSize={11}
        usePresetPositions
        layout={{ name: "preset" }}
        wide
        interactive
      />

      <div className="border-t border-foreground/[0.08] px-4 py-3">
        <p className="text-[13px] leading-relaxed text-foreground/65">
          {message}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {(["N1", "N2", "N3"] as const).map((n) => (
            <div key={n} className="rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{n} (MIN)</div>
              <div className={`text-[13px] font-medium ${successPath.has(n) ? "text-green-600 dark:text-green-400" : "text-foreground/70"}`}>
                min({n === "N1" ? computed.m.M11 : n === "N2" ? computed.m.M21 : computed.m.M31},
                {" "}{n === "N1" ? computed.m.M12 : n === "N2" ? computed.m.M22 : computed.m.M32}) = {computed.n[n]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
