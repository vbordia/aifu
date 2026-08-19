"use client";

import { useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type QuizOption = { label: string; text: string };

export default function Quiz({
  question,
  options,
  correctAnswer,
  explanation,
}: {
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-foreground/[0.1] bg-foreground/[0.02]">
      <div className="border-b border-foreground/[0.08] bg-foreground/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
            Quiz
          </span>
          <span className="text-[13.5px] font-medium text-foreground/80">{question}</span>
        </div>
      </div>

      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {options.map((option) => {
          const isCorrect = option.label === correctAnswer;
          const isSelected = option.label === selected;
          const showState = answered && (isCorrect || isSelected);

          return (
            <button
              key={option.label}
              type="button"
              disabled={answered}
              onClick={() => setSelected(option.label)}
              className={cn(
                "group flex items-start gap-2.5 rounded-lg border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2.5 text-left transition-colors",
                !answered &&
                  "cursor-pointer hover:border-foreground/[0.2] hover:bg-foreground/[0.05]",
                showState && isCorrect &&
                  "border-emerald-500/40 bg-emerald-500/[0.08]",
                showState && isSelected && !isCorrect &&
                  "border-red-500/40 bg-red-500/[0.08]"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                  "border-foreground/[0.15] text-foreground/50",
                  showState && isCorrect && "border-emerald-500/50 text-emerald-500",
                  showState && isSelected && !isCorrect && "border-red-500/50 text-red-500"
                )}
              >
                {showState && isCorrect ? <CheckIcon className="size-3" /> : showState && isSelected ? <XIcon className="size-3" /> : option.label}
              </span>
              <span className="text-[13px] leading-snug text-foreground/70">{option.text}</span>
            </button>
          );
        })}
      </div>

      {answered && explanation && (
        <div
          className={cn(
            "mx-4 mb-4 rounded-md border px-3 py-2.5 text-[13px] leading-relaxed",
            selected === correctAnswer
              ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300/80"
              : "border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300/80"
          )}
        >
          {selected === correctAnswer
            ? "Correct! "
            : `Not quite — the answer is ${correctAnswer}. `}
          {explanation}
        </div>
      )}
    </div>
  );
}