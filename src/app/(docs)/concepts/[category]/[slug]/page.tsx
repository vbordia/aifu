import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocsPage from "@/components/docs-page";
import {
  getAllCategories,
  getAllConcepts,
  getConceptBySlug,
} from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCategories().flatMap((category) =>
    category.concepts.map((concept) => ({
      category: category.slug,
      slug: concept.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const concept = getConceptBySlug(category, slug);
  return {
    title: concept ? concept.frontmatter.title : "Concept",
    description: concept?.frontmatter.description,
  };
}

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const concept = getConceptBySlug(category, slug);
  if (!concept) notFound();

  const { default: MDXContent } = await import(
    `@/content/concepts/${category}/${slug}.mdx`
  );

  const allConcepts = getAllConcepts();
  const index = allConcepts.findIndex(
    (c) => c.slug === slug && c.categorySlug === category
  );
  const prev = index > 0 ? allConcepts[index - 1] : null;
  const next =
    index >= 0 && index < allConcepts.length - 1 ? allConcepts[index + 1] : null;

  return (
    <DocsPage
      title={concept.frontmatter.title}
      description={concept.frontmatter.description}
      headings={concept.headings}
      prev={
        prev
          ? {
              title: prev.frontmatter.title,
              href: `/concepts/${prev.categorySlug}/${prev.slug}`,
            }
          : undefined
      }
      next={
        next
          ? {
              title: next.frontmatter.title,
              href: `/concepts/${next.categorySlug}/${next.slug}`,
            }
          : undefined
      }
    >
      <MDXContent />
    </DocsPage>
  );
}
