"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/lib/types";

function scrollToId(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

export default function TableOfContents({
  headings,
}: {
  headings: Heading[];
}) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const ids = headings.map((h) => h.id);
    if (!ids.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  const handleLineHover = (index: number | null) => setHoveredIndex(index);

  return (
    <div
      className="hidden lg:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setHoveredIndex(null);
      }}
    >
      <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2">
        {/* lines */}
        <nav aria-label="Table of contents">
          <ul className="flex flex-col gap-[3px]">
            {headings.map((heading, index) => {
              const isActive = activeId === heading.id;
              const isHovered = hoveredIndex === index;
              return (
                <li key={heading.id}>
                  <button
                    type="button"
                    onClick={() => scrollToId(heading.id)}
                    aria-label={`Jump to ${heading.text}`}
                    aria-current={isActive ? "true" : undefined}
                    onMouseEnter={() => handleLineHover(index)}
                    onFocus={() => handleLineHover(index)}
                    className="flex h-4 w-6 cursor-pointer items-center justify-end outline-none"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-[2px] rounded-full transition-all duration-150",
                        heading.level === 2 && "w-full",
                        heading.level === 3 && "w-[65%]",
                        heading.level === 4 && "w-[40%]",
                        isActive
                          ? "bg-foreground/90"
                          : isHovered
                            ? "bg-foreground/60"
                            : "bg-foreground/25"
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* single popover — opens to the left of the lines */}
        <div
          className={cn(
            "absolute right-full top-1/2 z-40 w-64 -translate-y-1/2 pr-3",
            "transition-[opacity,transform] duration-150",
            open
              ? "visible opacity-100 translate-x-0"
              : "invisible opacity-0 translate-x-1"
          )}
        >
          <div className="max-h-[min(60vh,32rem)] overflow-y-auto rounded-xl border border-foreground/[0.1] bg-background/95 p-1.5 shadow-xl shadow-black/20 backdrop-blur">
            <ul className="space-y-px">
              {headings.map((heading, index) => {
                const isActive = activeId === heading.id;
                const isHovered = hoveredIndex === index;
                return (
                  <li key={heading.id}>
                    <button
                      type="button"
                      onClick={() => scrollToId(heading.id)}
                      onMouseEnter={() => handleLineHover(index)}
                      onMouseLeave={() => handleLineHover(null)}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors",
                        heading.level === 3 && "pl-5",
                        heading.level === 4 && "pl-7",
                        isActive
                          ? "bg-foreground/[0.06] text-foreground/90"
                          : isHovered
                            ? "bg-foreground/[0.04] text-foreground/80"
                            : "text-foreground/55"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-[7px] h-[3px] w-3 shrink-0 rounded-full transition-colors",
                          heading.level === 2 && "w-4",
                          heading.level === 3 && "w-3",
                          heading.level === 4 && "w-2",
                          isActive
                            ? "bg-primary"
                            : isHovered
                              ? "bg-foreground/50"
                              : "bg-foreground/20"
                        )}
                      />
                      <span className="text-[13px] leading-snug">
                        {heading.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}