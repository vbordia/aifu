import type { Metadata } from "next";
import Link from "next/link";
import DocsPage from "@/components/docs-page";
import { getAllCategories } from "@/lib/content";

export const metadata: Metadata = {
  title: "Concepts",
  description: "Every concept in the AI Search course, organized by topic.",
};

export default function ConceptsIndexPage() {
  const categories = getAllCategories();

  return (
    <DocsPage
      title="Concepts"
      description="Every concept in the course, organized by topic."
      headings={[]}
    >
      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category.slug}>
            <h2 className="text-[21px] font-semibold tracking-tight text-foreground/85">
              <Link
                href={`/concepts/${category.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {category.name}
              </Link>
            </h2>
            {category.description && (
              <p className="mt-1 text-[15px] leading-[1.85] text-foreground/55">
                {category.description}
              </p>
            )}
            <ol className="ml-5 mt-4 list-decimal space-y-3">
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
          </section>
        ))}
      </div>
    </DocsPage>
  );
}