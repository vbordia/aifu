import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocsPage from "@/components/docs-page";
import {
  getAllLectures,
  getLectureBySlug,
} from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllLectures().map((lecture) => ({ slug: lecture.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lecture = getLectureBySlug(slug);
  return {
    title: lecture ? lecture.frontmatter.title : "Lecture",
    description: lecture?.frontmatter.description,
  };
}

export default async function LecturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lecture = getLectureBySlug(slug);
  if (!lecture) notFound();

  const { default: MDXContent } = await import(
    `@/content/lectures/${slug}.mdx`
  );

  const allLectures = getAllLectures();
  const index = allLectures.findIndex((l) => l.slug === slug);
  const prev = index > 0 ? allLectures[index - 1] : null;
  const next =
    index >= 0 && index < allLectures.length - 1 ? allLectures[index + 1] : null;

  return (
    <DocsPage
      title={lecture.frontmatter.title}
      description={lecture.frontmatter.description}
      headings={lecture.headings}
      prev={
        prev
          ? { title: prev.frontmatter.title, href: `/lectures/${prev.slug}` }
          : undefined
      }
      next={
        next
          ? { title: next.frontmatter.title, href: `/lectures/${next.slug}` }
          : undefined
      }
    >
      <MDXContent />
    </DocsPage>
  );
}
