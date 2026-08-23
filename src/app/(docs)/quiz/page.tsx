import type { Metadata } from "next";
import Link from "next/link";
import DocsPage from "@/components/docs-page";
import { getAllQuizPapers } from "@/lib/quiz";

export const metadata: Metadata = {
  title: "Question Papers",
  description: "Practice past exam papers with instant right/wrong feedback.",
};

export default function QuizIndexPage() {
  const papers = getAllQuizPapers();

  return (
    <DocsPage
      title="Question Papers"
      description="Attempt past exam papers interactively — pick options or type answers, then check against the official keys."
      headings={[]}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {papers.map((paper) => {
          const types = paper.items.reduce(
            (acc, i) => {
              acc[i.type] += 1;
              return acc;
            },
            { mcq: 0, multi: 0, short: 0 } as Record<string, number>
          );
          return (
            <Link
              key={paper.slug}
              href={`/quiz/${paper.slug}`}
              className="group rounded-xl border border-foreground/[0.1] p-4 transition-colors hover:border-foreground/30 hover:bg-foreground/[0.02]"
            >
              <p className="text-[15px] font-medium text-foreground/85 group-hover:text-foreground">
                {paper.title}
              </p>
              <p className="mt-1 text-[12.5px] text-foreground/45">{paper.fileName}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] tabular-nums text-foreground/50">
                <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5">
                  {paper.items.length} questions
                </span>
                {types.mcq > 0 && (
                  <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5">
                    {types.mcq} MCQ
                  </span>
                )}
                {types.multi > 0 && (
                  <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5">
                    {types.multi} multi-select
                  </span>
                )}
                {types.short > 0 && (
                  <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5">
                    {types.short} typed
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </DocsPage>
  );
}
