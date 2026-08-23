"use client";

import { useMemo, useState } from "react";
import LiteMarkdown, { renderInline } from "@/components/quiz/markdown-lite";
import Mermaid from "@/components/ui/mermaid";
import { cn } from "@/lib/utils";
import type { QuizItem } from "@/lib/quiz";

type AnswerState = {
  selected: string[];
  text: string;
  checked: boolean;
};

type Group = {
  key: string;
  title: string;
  label?: string;
  itemIds: string[];
};

type DialogState = { kind: "stem" | "chart"; content: string } | null;

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s.[\]{}()"']/g, "")
    .replace(/\s*,\s*/g, ",")
    .trim();
}

function isCorrect(item: QuizItem, state: AnswerState): boolean {
  if (item.type === "short") {
    const guess = normalize(state.text);
    return guess.length > 0 && item.accepted.includes(guess);
  }
  if (item.type === "multi") {
    const guess = [...state.selected].sort().join(",");
    return guess === item.accepted[0];
  }
  return state.selected.length === 1 && item.accepted.includes(normalize(state.selected[0]));
}

function prettyAnswer(item: QuizItem): string {
  if (item.type === "short") return item.accepted[0];
  const labels = item.accepted[0].split(",").map((s) => s.trim().toUpperCase());
  return labels
    .map((l) => {
      const opt = item.options?.find((o) => o.label.toUpperCase() === l);
      return opt ? `${l} — ${opt.text}` : l;
    })
    .join("; ");
}

const btn =
  "rounded-md border border-foreground/[0.12] px-3 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:bg-foreground/[0.07] disabled:cursor-not-allowed disabled:opacity-30";

export default function QuizRunner({ items }: { items: QuizItem[] }) {
  const [states, setStates] = useState<Record<string, AnswerState>>({});
  const [revealed, setRevealed] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [activeGroup, setActiveGroup] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [chartZoom, setChartZoom] = useState<"fit" | "actual">("fit");

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const item of items) {
      const m = item.id.match(/^(\d+)\./);
      const key = m ? m[1] : item.id;
      if (!map.has(key)) map.set(key, { key, title: `Q${key}`, label: item.label, itemIds: [] });
      map.get(key)!.itemIds.push(item.id);
    }
    return [...map.values()];
  }, [items]);

  const visibleItems = useMemo(() => {
    if (!focusMode) return items;
    const g = groups[Math.min(activeGroup, groups.length - 1)];
    return g ? items.filter((i) => g.itemIds.includes(i.id)) : items;
  }, [items, focusMode, activeGroup, groups]);

  const contextOfGroup = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups) {
      const first = items.find((i) => i.id === g.itemIds[0]);
      if (first?.context) map.set(g.key, first.context);
    }
    return map;
  }, [items, groups]);

  const getState = (id: string) => states[id] ?? { selected: [], text: "", checked: false };

  const update = (id: string, patch: Partial<AnswerState>) =>
    setStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { selected: [], text: "", checked: false }), ...patch, checked: false },
    }));

  const toggleOption = (item: QuizItem, label: string) => {
    const s = getState(item.id);
    if (item.type === "mcq") update(item.id, { selected: [label] });
    else
      update(item.id, {
        selected: s.selected.includes(label)
          ? s.selected.filter((x) => x !== label)
          : [...s.selected, label],
      });
  };

  const checkAll = () =>
    setStates((prev) => {
      const next: Record<string, AnswerState> = {};
      for (const item of items) {
        next[item.id] = { ...(prev[item.id] ?? { selected: [], text: "", checked: false }), checked: true };
      }
      return next;
    });

  const reset = () => setStates({});

  const graded = items.filter((i) => getState(i.id).checked);
  const correctCount = graded.filter((i) => isCorrect(i, getState(i.id))).length;

  const currentGroup = groups[Math.min(activeGroup, groups.length - 1)];
  const currentContext = currentGroup ? contextOfGroup.get(currentGroup.key) : undefined;

  const questionCard = (item: QuizItem) => {
    const s = getState(item.id);
    const right = isCorrect(item, s);
    const answerLabels = item.accepted[0]
      .split(",")
      .map((l) => l.trim().toUpperCase());
    return (
      <div
        key={item.id}
        className={cn(
          "scroll-mt-40 rounded-xl border p-4 transition-colors sm:p-5",
          s.checked
            ? right
              ? "border-green-500/40 bg-green-500/[0.04]"
              : "border-red-500/40 bg-red-500/[0.04]"
            : "border-foreground/[0.12]"
        )}
      >
        <div className="mb-1 flex items-start gap-2">
          <span className="mt-0.5 shrink-0 rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground/50">
            {item.id}
          </span>
          {item.label && (
            <span className="mt-0.5 rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              {item.label}
            </span>
          )}
        </div>

        <div className="mb-3 text-[14px] leading-relaxed text-foreground/80">
          <LiteMarkdown text={item.question} />
        </div>

        {item.options ? (
          <div className="space-y-2">
            {item.options.map((opt) => {
              const picked = s.selected.includes(opt.label);
              const isAnswer =
                revealed || (s.checked && answerLabels.includes(opt.label.toUpperCase()));
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => toggleOption(item, opt.label)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-[13px] leading-snug transition-colors",
                    picked
                      ? "border-indigo-500/60 bg-indigo-500/10 text-foreground/90"
                      : "border-foreground/[0.08] text-foreground/65 hover:border-foreground/25",
                    revealed && isAnswer && "border-green-500/60 bg-green-500/10",
                    s.checked && !right && picked && "border-red-500/50 bg-red-500/10"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-[11px] font-bold",
                      item.type === "multi" ? "rounded-sm" : "rounded-full",
                      picked
                        ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                        : "bg-foreground/[0.07] text-foreground/45"
                    )}
                  >
                    {opt.label}
                  </span>
                  <span>{renderInline(opt.text, `o-${item.id}-${opt.label}`)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type="text"
            value={s.text}
            onChange={(e) => update(item.id, { text: e.target.value })}
            placeholder="Type your answer…"
            spellCheck={false}
            autoComplete="off"
            className="w-full rounded-lg border border-foreground/[0.12] bg-background px-3 py-2 font-mono text-[13px] text-foreground/85 outline-hidden transition-colors placeholder:text-foreground/30 focus:border-indigo-500/50"
          />
        )}

        {(s.checked || revealed) && (
          <p
            className={cn(
              "mt-3 text-[12.5px] leading-relaxed",
              s.checked && right ? "text-green-700 dark:text-green-400" : "text-foreground/60"
            )}
          >
            {s.checked && (right ? "✓ Correct!" : "✗ Not quite.")}{" "}
            <span className="font-medium text-foreground/75">Answer: {prettyAnswer(item)}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Sticky toolbar — offset below the app header */}
      <div className="sticky top-[52px] z-10 mb-5 space-y-2 bg-background/95 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/[0.1] bg-background/95 px-4 py-2.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <div className="flex overflow-hidden rounded-md border border-foreground/[0.12]">
              <button
                type="button"
                onClick={() => setFocusMode(true)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium transition-colors",
                  focusMode ? "bg-foreground/[0.08] text-foreground/85" : "text-foreground/45 hover:text-foreground/70"
                )}
              >
                Focus
              </button>
              <button
                type="button"
                onClick={() => setFocusMode(false)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium transition-colors",
                  !focusMode ? "bg-foreground/[0.08] text-foreground/85" : "text-foreground/45 hover:text-foreground/70"
                )}
              >
                All
              </button>
            </div>
            <span className="tabular-nums text-foreground/55">{items.length} questions</span>
            {graded.length > 0 && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                  correctCount === graded.length
                    ? "bg-green-500/15 text-green-700 dark:text-green-400"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                )}
              >
                Score {correctCount} / {graded.length}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={checkAll} className="rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300">
              Check answers
            </button>
            <button type="button" onClick={() => setRevealed((r) => !r)} className={btn}>
              {revealed ? "Hide answers" : "Reveal all"}
            </button>
            <button type="button" onClick={reset} className={btn}>
              Reset
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-0.5">
          {focusMode && (
            <>
              <button
                type="button"
                disabled={activeGroup === 0}
                onClick={() => setActiveGroup((g) => Math.max(0, g - 1))}
                className="rounded-full border border-foreground/[0.12] px-2 py-1 text-[11px] text-foreground/55 transition-colors hover:bg-foreground/[0.06] disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={activeGroup >= groups.length - 1}
                onClick={() => setActiveGroup((g) => Math.min(groups.length - 1, g + 1))}
                className="rounded-full border border-foreground/[0.12] px-2 py-1 text-[11px] text-foreground/55 transition-colors hover:bg-foreground/[0.06] disabled:opacity-30"
              >
                Next →
              </button>
            </>
          )}
          {groups.map((g, gi) => (
            <button
              key={g.key}
              type="button"
              onClick={() => {
                if (focusMode) setActiveGroup(gi);
                else document.getElementById(`quiz-group-${g.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                focusMode
                  ? gi === activeGroup
                    ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                    : "border-foreground/[0.12] text-foreground/50 hover:border-foreground/30"
                  : "border-foreground/[0.12] text-foreground/55 hover:border-foreground/30 hover:text-foreground/80"
              )}
            >
              {g.title}
            </button>
          ))}
        </div>
      </div>

      {/* Focus mode */}
      {focusMode ? (
        currentContext ? (
          /* Stem + subquestions two-column */
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <aside className="lg:sticky lg:top-[124px]">
              <div className="rounded-xl border border-foreground/[0.12] bg-foreground/[0.02] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                    Question stem · {currentGroup?.title}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      currentContext && setDialog({ kind: "stem", content: currentContext })
                    }
                    className="shrink-0 rounded border border-foreground/[0.12] px-1.5 py-0.5 text-[10px] font-medium text-foreground/55 transition-colors hover:bg-foreground/[0.06]"
                  >
                    View large ↗
                  </button>
                </div>
                <LiteMarkdown
                  text={currentContext}
                  onMermaidClick={(chart) => setDialog({ kind: "chart", content: chart })}
                />
              </div>
              <p className="mt-3 hidden px-1 text-[11px] leading-relaxed text-foreground/35 lg:block">
                Tip: click any diagram to expand it full-screen.
              </p>
            </aside>

            <div className="space-y-6 min-w-0">{visibleItems.map(questionCard)}</div>
          </div>
        ) : (
          /* No stem: questions span the full content width */
          <div className="mx-auto max-w-5xl space-y-6">{visibleItems.map(questionCard)}</div>
        )
      ) : (
        /* All mode: continuous */
        <div className="space-y-6">
          {items.map((item) => {
            const g = groups.find((x) => x.itemIds.includes(item.id));
            const isGroupStart = g ? g.itemIds[0] === item.id : false;
            const ctx = g ? contextOfGroup.get(g.key) : undefined;
            if (!g) return null;
            return (
              <div key={`wrap-${item.id}`} className="space-y-6">
                {isGroupStart && ctx && (
                  <div
                    id={`quiz-group-${g.key}`}
                    className="scroll-mt-40 rounded-xl border border-foreground/[0.12] bg-foreground/[0.02] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                        Question stem · Q{g.key}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "stem", content: ctx })}
                        className="shrink-0 rounded border border-foreground/[0.12] px-1.5 py-0.5 text-[10px] font-medium text-foreground/55 transition-colors hover:bg-foreground/[0.06]"
                      >
                        View large ↗
                      </button>
                    </div>
                    <LiteMarkdown
                      text={ctx}
                      onMermaidClick={(chart) => setDialog({ kind: "chart", content: chart })}
                    />
                  </div>
                )}
                {questionCard(item)}
              </div>
            );
          })}
        </div>
      )}

      {/* Focus-mode pager */}
      {focusMode && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            disabled={activeGroup === 0}
            onClick={() => setActiveGroup((g) => Math.max(0, g - 1))}
            className={btn}
          >
            ← Previous
          </button>
          <span className="text-xs tabular-nums text-foreground/40">
            {activeGroup + 1} / {groups.length}
          </span>
          <button
            type="button"
            disabled={activeGroup >= groups.length - 1}
            onClick={() => setActiveGroup((g) => Math.min(groups.length - 1, g + 1))}
            className={btn}
          >
            Next →
          </button>
        </div>
      )}

      {/* Full-screen dialog: stem or single chart */}
      {dialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
          onClick={() => setDialog(null)}
        >
          <div
            className={cn(
              "flex max-h-[94vh] flex-col rounded-2xl border border-foreground/[0.15] bg-background shadow-2xl",
              dialog.kind === "chart" ? "h-[92vh] w-[96vw] max-w-[1700px]" : "max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex shrink-0 items-center justify-between gap-2 px-1">
              <p className="text-sm font-semibold text-foreground/80">
                {dialog.kind === "chart" ? "Diagram" : "Question stem"}
              </p>
              <div className="flex gap-2">
                {dialog.kind === "chart" && (
                  <div className="flex overflow-hidden rounded-md border border-foreground/[0.12]">
                    <button
                      type="button"
                      onClick={() => setChartZoom("fit")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium transition-colors",
                        chartZoom === "fit" ? "bg-foreground/[0.08] text-foreground/85" : "text-foreground/45 hover:text-foreground/70"
                      )}
                    >
                      Fit width
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartZoom("actual")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium transition-colors",
                        chartZoom === "actual" ? "bg-foreground/[0.08] text-foreground/85" : "text-foreground/45 hover:text-foreground/70"
                      )}
                    >
                      Actual size
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="rounded-md border border-foreground/[0.12] px-2.5 py-1 text-xs text-foreground/60 hover:bg-foreground/[0.06]"
                >
                  Close ✕
                </button>
              </div>
            </div>
            {dialog.kind === "chart" ? (
              chartZoom === "fit" ? (
                <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-foreground/[0.02] p-4">
                  <Mermaid key={`fit-${dialog.content.length}`} chart={dialog.content} />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-foreground/[0.02] p-4">
                  <div className="w-max">
                    <Mermaid key={`actual-${dialog.content.length}`} chart={dialog.content} natural />
                  </div>
                </div>
              )
            ) : (
              <LiteMarkdown text={dialog.content} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
