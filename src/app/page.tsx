import Link from "next/link";
import SearchPalette from "@/components/search-palette";
import ThemeToggle from "@/components/theme-toggle";
import { getAllCategories, getAllLectures } from "@/lib/content";
import { getSearchDocuments } from "@/lib/search-docs";

export default function Home() {
  const categories = getAllCategories();
  const lectures = getAllLectures();
  const searchDocs = getSearchDocuments();

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-10">
        <header className="flex items-center justify-end gap-1">
          <nav className="flex items-center gap-1">
            <Link
              href="/concepts"
              className="rounded-md px-3 py-1.5 text-[13px] text-foreground/55 transition-colors hover:text-foreground/90"
            >
              Concepts
            </Link>
            <Link
              href="/lectures"
              className="rounded-md px-3 py-1.5 text-[13px] text-foreground/55 transition-colors hover:text-foreground/90"
            >
              Lectures
            </Link>
            <Link
              href="/quiz"
              className="rounded-md px-3 py-1.5 text-[13px] text-foreground/55 transition-colors hover:text-foreground/90"
            >
              Practice
            </Link>
            <SearchPalette docs={searchDocs} />
            <ThemeToggle />
          </nav>
        </header>

        <main className="py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground/90">
            AI Search
          </h1>

          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-foreground/85">
              Concepts
            </h2>
            <div className="mt-4 space-y-4">
              {categories.map((category) => (
                <div
                  key={category.slug}
                  className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] p-4"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <Link
                      href={`/concepts/${category.slug}`}
                      className="text-[15px] font-medium text-foreground/85 transition-colors hover:text-foreground"
                    >
                      {category.name}
                    </Link>
                    <span className="shrink-0 text-[11px] tabular-nums text-foreground/35">
                      {category.concepts.length}
                    </span>
                  </div>
                  {category.description && (
                    <p className="mt-1 text-[13px] leading-relaxed text-foreground/45">
                      {category.description}
                    </p>
                  )}
                  <ul className="mt-3 space-y-px">
                    {category.concepts.map((concept) => (
                      <li key={concept.slug}>
                        <Link
                          href={`/concepts/${category.slug}/${concept.slug}`}
                          className="block rounded-md px-1.5 py-1 text-[13.5px] text-foreground/60 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/90"
                        >
                          {concept.frontmatter.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-foreground/85">
              Lectures
            </h2>
            <div className="mt-4 space-y-2">
              {lectures.map((lecture) => (
                <Link
                  key={lecture.slug}
                  href={`/lectures/${lecture.slug}`}
                  className="flex items-baseline justify-between gap-4 rounded-lg border border-foreground/[0.08] bg-foreground/[0.02] px-4 py-3 transition-colors hover:border-foreground/[0.18] hover:bg-foreground/[0.05]"
                >
                  <span className="text-[14px] font-medium text-foreground/80">
                    {lecture.frontmatter.title}
                  </span>
                  {lecture.frontmatter.duration && (
                    <span className="shrink-0 text-[12px] tabular-nums text-foreground/40">
                      {lecture.frontmatter.duration}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}