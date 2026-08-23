"use client";

import { useState } from "react";
import LiteMarkdown, { renderInline } from "@/components/quiz/markdown-lite";
import { cn } from "@/lib/utils";
import type { QuizItem } from "@/lib/quiz";

type AnswerState = {
  selected: string[];
  text: string;
  checked: boolean;
};

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s.\[\]{}()"']/g, "")
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
  const texts = labels.map(
    (l) => `${l}${item.options?.find((o) => o.label.toUpperCase() === l)?.text ? ` — ${item.options.find((o) => o.label.toUpperCase() === l)!.text}` : ""}`
  );
  return texts.join("; ");
}

export default function QuizRunner({ items }: { items: QuizItem[] }) {
  const [states, setStates] = useState<Record<string, AnswerState>>({});
  const [revealed, setRevealed] = useState(false);

  const getState = (id: string): AnswerState => states[id] ?? { selected: [], text: "", checked: false };

  const update = (id: string, patch: Partial<AnswerState>) =>
    setStates((prev) => ({
      ...prev,
      [id]: { ...getState(id), ...patch, checked: false },
    }));

  const toggleOption = (item: QuizItem, label: string) => {
    const s = getState(item.id);
    if (item.type === "mcq") {
      update(item.id, { selected: [label] });
    } else {
      const has = s.selected.includes(label);
      update(item.id, {
        selected: has ? s.selected.filter((x) => x !== label) : [...s.selected, label],
      });
    }
  };

  const checkAll = () =>
    setStates((prev) => {
      const next: Record<string, AnswerState> = {};
      for (const item of items) {
        const s = prev[item.id] ?? { selected: [], text: "", checked: false };
        next[item.id] = { ...s, checked: true };
      }
      return next;
    });

  const reset = () => {
    setStates({});
    setRevealed(false);
  };

  const graded = items.filter((i) => getState(i.id).checked);
  const correctCount = graded.filter((i) => isCorrect(i, getState(i.id))).length;

  let lastContext: string | undefined;

  return (
    <div>
      <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/[0.1] bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3 text-[13px]">
          <span className="font-medium text-foreground/80">{items.length} questions</span>
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
          <button
            type="button"
            onClick={checkAll}
            className="rounded-md border border-foreground/[0.15] bg-foreground/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/75 transition-colors hover:bg-foreground/[0.1]"
          >
            Check answers
          </button>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.08]"
          >
            {revealed ? "Hide answers" : "Reveal all"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-foreground/[0.1] bg-transparent px-3 py-1.5 text-xs font-medium text-foreground/50 transition-colors hover:bg-foreground/[0.06]"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {items.map((item) => {
          const s = getState(item.id);
          const showContext = item.context && item.context !== lastContext;
          lastContext = item.context;
          const right = isCorrect(item, s);
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-xl border p-4 transition-colors sm:p-5",
                s.checked
                  ? right
                    ? "border-green-500/40 bg-green-500/[0.04]"
                    : "border-red-500/40 bg-red-500/[0.04]"
                  : "border-foreground/[0.1]"
              )}
            >
              {showContext && item.context && (
                <div className="mb-3 rounded-lg border border-foreground/[0.08] bg-foreground/[0.02] px-4 py-3">
                  <LiteMarkdown text={item.context} />
                </div>
              )}

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
                    const answerLabels = item.accepted[0]
                      .split(",")
                      .map((l) => l.trim().toUpperCase());
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
                          revealed && isAnswer && "border-green-500/50 bg-green-500/10",
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
                  {s.checked &&
                    (right ? "✓ Correct!" : `✗ Not quite.`)}{" "}
                  <span className="font-medium text-foreground/75">
                    Answer: {prettyAnswer(item)}
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
