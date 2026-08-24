import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocsPage from "@/components/docs-page";
import {
  getAllPaperSlugs,
  getPaperInfo,
  getPaperQuestion,
  getPaperQuestions,
} from "@/lib/papers";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPaperSlugs().flatMap((paper) =>
    getPaperQuestions(paper).map((q) => ({
      paper,
      question: String(q.frontmatter.question),
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ paper: string; question: string }>;
}): Promise<Metadata> {
  const { paper, question } = await params;
  const q = getPaperQuestion(paper, question);
  return {
    title: q ? q.frontmatter.title : "Question Solution",
    description: q?.frontmatter.description,
  };
}

export default async function PaperQuestionSolutionPage({
  params,
}: {
  params: Promise<{ paper: string; question: string }>;
}) {
  const { paper, question } = await params;
  const q = getPaperQuestion(paper, question);
  if (!q) notFound();
  const info = getPaperInfo(paper);
  const questions = info?.questions ?? [];
  const index = questions.findIndex(
    (x) => x.frontmatter.question === q.frontmatter.question
  );
  const prev = index > 0 ? questions[index - 1] : null;
  const next =
    index >= 0 && index < questions.length - 1 ? questions[index + 1] : null;

  const { default: MDXContent } = await import(
    `@/content/papers/${paper}/${q.slug}.mdx`
  );

  return (
    <DocsPage
      title={q.frontmatter.title}
      description={q.frontmatter.description}
      headings={q.headings}
      prev={
        index === 0
          ? {
              title: "All solutions",
              href: `/quiz/${paper}/answer`,
            }
          : prev
            ? {
                title: `Q${prev.frontmatter.question} — ${prev.frontmatter.short ?? prev.frontmatter.title}`,
                href: `/quiz/${paper}/answer/${prev.frontmatter.question}`,
              }
            : undefined
      }
      next={
        next
          ? {
              title: `Q${next.frontmatter.question} — ${next.frontmatter.short ?? next.frontmatter.title}`,
              href: `/quiz/${paper}/answer/${next.frontmatter.question}`,
            }
          : {
              title: "Attempt this paper",
              href: `/quiz/${paper}`,
            }
      }
    >
      <MDXContent />
    </DocsPage>
  );
}
