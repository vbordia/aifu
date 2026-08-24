import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DocsPage from "@/components/docs-page";
import { getAllPaperSlugs, getPaperInfo } from "@/lib/papers";
import { getAllQuizPapers } from "@/lib/quiz";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPaperSlugs().map((paper) => ({ paper }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ paper: string }>;
}): Promise<Metadata> {
  const { paper: slug } = await params;
  const info = getPaperInfo(slug);
  return {
    title: info ? `${info.title} — Worked Solutions` : "Worked Solutions",
    description: "Step-by-step solutions for every question in this paper.",
  };
}

export default async function PaperSolutionsIndexPage({
  params,
}: {
  params: Promise<{ paper: string }>;
}) {
  const { paper: slug } = await params;
  const info = getPaperInfo(slug);
  if (!info) notFound();
  const quizPaper = getAllQuizPapers().find((p) => p.slug === slug);

  return (
    <DocsPage
      title={`${info.title} — Worked Solutions`}
      description="Every question solved from scratch: the reasoning, the algorithm trace, and the shortcuts that get you to the answer fast."
      headings={[]}
      prev={{
        title: "Question Papers",
        href: "/quiz",
      }}
      next={
        quizPaper
          ? { title: `Attempt ${info.title}`, href: `/quiz/${slug}` }
          : undefined
      }
    >
      <div className="mb-6 flex flex-wrap gap-3">
        {quizPaper && (
          <Link
            href={`/quiz/${slug}`}
            className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-[13px] font-medium text-indigo-700 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
          >
            ← Attempt this paper interactively
          </Link>
        )}
      </div>
      <div className="grid gap-3">
        {info.questions.map((q) => (
          <Link
            key={q.slug}
            href={`/quiz/${slug}/answer/${q.frontmatter.question}`}
            className="group rounded-xl border border-foreground/[0.1] p-4 transition-colors hover:border-foreground/30 hover:bg-foreground/[0.02]"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground/50">
                Q{q.frontmatter.question}
              </span>
              {q.frontmatter.label && (
                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                  {q.frontmatter.label}
                </span>
              )}
            </div>
            <p className="mt-2 text-[15px] font-medium text-foreground/85 group-hover:text-foreground">
              {q.frontmatter.title}
            </p>
            {q.frontmatter.description && (
              <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/45">
                {q.frontmatter.description}
              </p>
            )}
            {q.frontmatter.topics && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {q.frontmatter.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] text-foreground/50"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </DocsPage>
  );
}
