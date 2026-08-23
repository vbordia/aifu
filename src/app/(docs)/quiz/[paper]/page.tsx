import type { Metadata } from "next";
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
      <QuizRunner items={paper.items} />
    </DocsPage>
  );
}
