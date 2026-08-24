import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DocsPage from "@/components/docs-page";
import QuizRunner from "@/components/quiz/quiz-runner";
import { getAllQuizPapers, getQuizPaper } from "@/lib/quiz";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllQuizPapers().map((paper) => ({ paper: paper.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ paper: string }>;
}): Promise<Metadata> {
  const { paper: slug } = await params;
  const paper = getQuizPaper(slug);
  return {
    title: paper ? `${paper.title} — Quiz` : "Question Paper",
    description: "Interactive attempt at a past exam paper with instant grading.",
  };
}

export default async function QuizPaperPage({
  params,
}: {
  params: Promise<{ paper: string }>;
}) {
  const { paper: slug } = await params;
  const paper = getQuizPaper(slug);
  if (!paper) notFound();

  return (
    <DocsPage
      wide
      title={paper.title}
      description={`${paper.items.length} questions from ${paper.fileName}. Answer everything, then hit "Check answers".`}
      headings={[]}
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/quiz/${slug}/answer`}
          className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-[13px] font-medium text-indigo-700 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
        >
          Worked solutions, step by step ↗
        </Link>
        <span className="text-[12px] text-foreground/40">
          Stuck on a question? Open its full solution — traces, visuals, shortcuts.
        </span>
      </div>
      <QuizRunner items={paper.items} paper={slug} />
    </DocsPage>
  );
}
