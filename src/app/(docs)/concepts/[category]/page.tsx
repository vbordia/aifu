import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DocsPage from "@/components/docs-page";
import { getAllCategories } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const found = getAllCategories().find((c) => c.slug === category);
  return {
    title: found ? found.name : "Category",
    description: found?.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = getAllCategories().find((c) => c.slug === categorySlug);
  if (!category) notFound();

  return (
    <DocsPage
      title={category.name}
      description={category.description}
      headings={[]}
    >
      <ol className="ml-5 list-decimal space-y-3">
        {category.concepts.map((concept) => (
          <li key={concept.slug} className="text-[15px] leading-[1.85] text-foreground/65">
            <Link
              href={`/concepts/${category.slug}/${concept.slug}`}
              className="font-medium text-foreground/80 underline underline-offset-[3px] decoration-foreground/[0.2] transition-colors hover:text-foreground hover:decoration-foreground/60"
            >
              {concept.frontmatter.title}
            </Link>
            {concept.frontmatter.description && (
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-foreground/45">
                {concept.frontmatter.description}
              </p>
            )}
          </li>
        ))}
      </ol>
    </DocsPage>
  );
}
