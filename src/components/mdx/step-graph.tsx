"use client";

import { useState } from "react";
import CytoscapeGraph from "@/components/ui/cytoscape";
import type { ElementDefinition } from "cytoscape";
import { cn } from "@/lib/utils";

export type GraphStep = {
  label: string;
  note?: string;
  elements: ElementDefinition[];
};

export type LegendItem = { color: string; label: string };

const btn =
  "rounded-md border border-foreground/[0.12] px-2.5 py-1 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.06] disabled:cursor-not-allowed disabled:opacity-30";

export default function StepGraph({
  steps,
  height = 420,
  nodeWidth,
  nodeHeight,
  nodeFontSize,
  legend,
}: {
  steps: GraphStep[];
  height?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  nodeFontSize?: number;
  legend?: LegendItem[];
}) {
  const [active, setActive] = useState(0);
  const step = steps[Math.min(active, steps.length - 1)];

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-foreground/[0.1] bg-foreground/[0.02]">
      <div className="flex flex-wrap items-center gap-2 border-b border-foreground/[0.08] px-3 py-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            className={btn}
            disabled={active === 0}
            onClick={() => setActive((a) => Math.max(0, a - 1))}
          >
            ← Prev
          </button>
          <button
            type="button"
            className={btn}
            disabled={active >= steps.length - 1}
            onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}
          >
            Next →
          </button>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {steps.map((s, i) => (
            <button
              key={s.label + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "max-w-full truncate rounded-full border px-2 py-0.5 text-[10.5px] font-medium transition-colors",
                i === active
                  ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                  : "border-foreground/[0.1] text-foreground/45 hover:border-foreground/30 hover:text-foreground/70"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-foreground/40">
          {active + 1} / {steps.length}
        </span>
      </div>

      <CytoscapeGraph
        key={active}
        elements={step.elements}
        height={height}
        nodeWidth={nodeWidth}
        nodeHeight={nodeHeight}
        nodeFontSize={nodeFontSize}
        layout={{ name: "preset" }}
      />

      {step.note && (
        <div className="whitespace-pre-wrap border-t border-foreground/[0.08] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-foreground/70">
          {step.note}
        </div>
      )}

      {legend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-foreground/[0.08] px-4 py-2">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-foreground/50">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
