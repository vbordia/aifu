"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BreadcrumbProps = {
  categories: {
    slug: string;
    name: string;
    concepts: { slug: string; frontmatter: { title: string } }[];
  }[];
  lectures: { slug: string; frontmatter: { title: string } }[];
};

type Segment = { label: string; href?: string; current?: boolean };

export default function Breadcrumb({ categories, lectures }: BreadcrumbProps) {
  const pathname = usePathname();

  const conceptMatch = pathname.match(/^\/concepts\/([^/]+)\/([^/]+)/);
  const categoryMatch = pathname.match(/^\/concepts\/([^/]+)/);

  let segments: Segment[] = [];

  if (pathname === "/concepts") {
    segments = [{ label: "Concepts", current: true }];
  } else if (conceptMatch) {
    const category = categories.find((c) => c.slug === conceptMatch[1]);
    const concept = category?.concepts.find((c) => c.slug === conceptMatch[2]);
    segments = [
      { label: "Concepts", href: "/concepts" },
      ...(category
        ? [{ label: category.name, href: `/concepts/${category.slug}` }]
        : []),
      { label: concept?.frontmatter.title ?? conceptMatch[2], current: true },
    ];
  } else if (categoryMatch) {
    const category = categories.find((c) => c.slug === categoryMatch[1]);
    segments = [
      { label: "Concepts", href: "/concepts" },
      { label: category?.name ?? categoryMatch[1], current: true },
    ];
  } else if (pathname === "/lectures") {
    segments = [{ label: "Lectures", current: true }];
  } else if (pathname.match(/^\/lectures\/([^/]+)/)) {
    const lectureMatch = pathname.match(/^\/lectures\/([^/]+)/);
    const lecture = lectures.find((l) => l.slug === lectureMatch?.[1]);
    segments = [
      { label: "Lectures", href: "/lectures" },
      { label: lecture?.frontmatter.title ?? lectureMatch?.[1] ?? "", current: true },
    ];
  }

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
    >
      {segments.map((segment, index) => (
        <span key={index} className="flex min-w-0 items-center gap-1.5">
          {index > 0 && (
            <ChevronRightIcon className="size-3.5 shrink-0 text-foreground/25" />
          )}
          {segment.href && !segment.current ? (
            <Link
              href={segment.href}
              className="truncate text-[13px] text-foreground/45 transition-colors hover:text-foreground/80"
            >
              {segment.label}
            </Link>
          ) : (
            <span
              className={cn(
                "truncate text-[13px]",
                segment.current
                  ? "font-medium text-foreground/85"
                  : "text-foreground/45"
              )}
            >
              {segment.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}