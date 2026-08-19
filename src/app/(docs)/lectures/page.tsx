import type { Metadata } from "next";
import Link from "next/link";
import DocsPage from "@/components/docs-page";
import { getAllLectures } from "@/lib/content";

export const metadata: Metadata = {
  title: "Lectures",
  description: "All lectures in the AI Search course.",
};

export default function LecturesIndexPage() {
  const lectures = getAllLectures();

  return (
    <DocsPage
      title="Lectures"
      description="Watch and follow along with the course lectures."
      headings={[]}
    >
      <ol className="ml-5 list-decimal space-y-3">
        {lectures.map((lecture) => (
          <li key={lecture.slug} className="text-[15px] leading-[1.85] text-foreground/65">
            <span className="flex flex-wrap items-baseline gap-2">
              <Link
                href={`/lectures/${lecture.slug}`}
                className="font-medium text-foreground/80 underline underline-offset-[3px] decoration-foreground/[0.2] transition-colors hover:text-foreground hover:decoration-foreground/60"
              >
                {lecture.frontmatter.title}
              </Link>
              {lecture.frontmatter.duration && (
                <span className="text-[12px] tabular-nums text-foreground/40">
                  {lecture.frontmatter.duration}
                </span>
              )}
            </span>
            {lecture.frontmatter.description && (
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-foreground/45">
                {lecture.frontmatter.description}
              </p>
            )}
          </li>
        ))}
      </ol>
    </DocsPage>
  );
}