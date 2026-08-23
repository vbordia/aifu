import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import TableOfContents from "@/components/table-of-contents";
import type { Heading } from "@/lib/types";

type NavItem = { title: string; href: string };

export default function DocsPage({
  title,
  description,
  headings,
  prev,
  next,
  children,
}: {
  title: string;
  description?: string;
  headings: Heading[];
  prev?: NavItem;
  next?: NavItem;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-8">
        <article className="min-w-0">
        <header className="mb-9">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground/90">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/55">
              {description}
            </p>
          )}
        </header>

        <div>{children}</div>

        {(prev || next) && (
          <nav
            aria-label="Page navigation"
            className="mt-12 grid gap-3 border-t border-foreground/[0.08] pt-6 sm:grid-cols-2"
          >
            {prev ? (
              <Link
                href={prev.href}
                className="group flex items-center gap-2 rounded-lg border border-foreground/[0.08] bg-foreground/[0.02] p-3 transition-colors hover:border-foreground/[0.2] hover:bg-foreground/[0.05]"
              >
                <ChevronLeftIcon className="size-4 shrink-0 text-foreground/35 transition-transform group-hover:-translate-x-0.5" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-foreground/40">
                    Previous
                  </span>
                  <span className="block truncate text-[13px] font-medium text-foreground/80">
                    {prev.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={next.href}
                className="group flex items-center justify-end gap-2 rounded-lg border border-foreground/[0.08] bg-foreground/[0.02] p-3 text-right transition-colors hover:border-foreground/[0.2] hover:bg-foreground/[0.05]"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-foreground/40">
                    Next
                  </span>
                  <span className="block truncate text-[13px] font-medium text-foreground/80">
                    {next.title}
                  </span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-foreground/35 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </nav>
        )}
        </article>
      </div>
      {headings.length > 0 && <TableOfContents headings={headings} />}
    </>
  );
}