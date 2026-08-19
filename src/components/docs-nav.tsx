"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDownIcon,
  FolderOpenIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type ConceptItem = {
  slug: string;
  categorySlug: string;
  frontmatter: { title: string; order: number };
};

type Category = {
  slug: string;
  name: string;
  concepts: ConceptItem[];
};

type Lecture = {
  slug: string;
  frontmatter: {
    title: string;
    week?: number;
    lectures?: string[];
    duration?: string;
    description?: string;
  };
};

function useActiveConcept() {
  const pathname = usePathname();
  const match = pathname.match(/^\/concepts\/([^/]+)\/([^/]+)/);
  return {
    concept: match ? `${match[1]}/${match[2]}` : null,
    lecture: pathname.match(/^\/lectures\/([^/]+)/)?.[1] ?? null,
  };
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
      {children}
    </SidebarGroupLabel>
  );
}

function LecturePopover({
  lecture,
  isOpen,
  onOpen,
  onClose,
  children,
}: {
  lecture: Lecture;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    onOpen();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(onClose, 150);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    const frame = requestAnimationFrame(updatePosition);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      cancelAnimationFrame(frame);
    };
  }, [isOpen, updatePosition]);

  const popover = isOpen
    ? createPortal(
        <div
          ref={popoverRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed z-[100] w-60 -translate-y-1/2 rounded-lg border border-foreground/[0.1] bg-sidebar/95 p-2.5 shadow-xl shadow-black/20 backdrop-blur transition-[opacity,transform] duration-150 animate-in fade-in-0 zoom-in-95"
          style={{ top: coords.top, left: coords.left }}
        >
          <p className="text-[12px] font-medium leading-snug text-sidebar-foreground/90">
            {lecture.frontmatter.title}
          </p>
          {(lecture.frontmatter.duration || lecture.frontmatter.week) && (
            <p className="mt-1 flex items-center gap-2 text-[11px] tabular-nums text-sidebar-foreground/45">
              {lecture.frontmatter.week && <span>Week {lecture.frontmatter.week}</span>}
              {lecture.frontmatter.week && lecture.frontmatter.duration && (
                <span className="text-sidebar-foreground/20">·</span>
              )}
              {lecture.frontmatter.duration && <span>{lecture.frontmatter.duration}</span>}
            </p>
          )}
          {lecture.frontmatter.description && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-sidebar-foreground/55 line-clamp-2">
              {lecture.frontmatter.description}
            </p>
          )}
          {lecture.frontmatter.lectures && lecture.frontmatter.lectures.length > 0 && (
            <div className="mt-2 border-t border-foreground/[0.08] pt-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/35">
                Lectures
              </p>
              <ul className="space-y-0.5">
                {lecture.frontmatter.lectures.map((name) => (
                  <li
                    key={name}
                    className="text-[11px] leading-snug text-sidebar-foreground/60"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {popover}
    </div>
  );
}

export default function DocsNav({
  categories,
  lectures,
}: {
  categories: Category[];
  lectures: Lecture[];
}) {
  const active = useActiveConcept();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activePopoverSlug, setActivePopoverSlug] = useState<string | null>(null);

  const activeCategorySlug = active.concept?.split("/")[0] ?? null;

  const q = query.trim().toLowerCase();

  const conceptResults = useMemo(() => {
    if (!q) return [];
    return categories.flatMap((category) =>
      category.concepts
        .filter((c) => c.frontmatter.title.toLowerCase().includes(q))
        .map((c) => ({ ...c, categoryName: category.name }))
    );
  }, [categories, q]);

  const lectureResults = useMemo(
    () => (q ? lectures.filter((l) => l.frontmatter.title.toLowerCase().includes(q)) : []),
    [lectures, q]
  );

  const toggleCategory = (slug: string) =>
    setCollapsed((prev) => ({ ...prev, [slug]: !prev[slug] }));

  const isCategoryOpen = (slug: string) =>
    activeCategorySlug === slug || !collapsed[slug];

  return (
    <SidebarContent className="px-1.5">
      <div className="px-2 pb-1 pt-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sidebar-foreground/40" />
          <SidebarInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search concepts…"
            className="h-8 pl-8 pr-8 text-[13px]"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>
      </div>

      {q ? (
        <>
          {conceptResults.length === 0 && lectureResults.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-sidebar-foreground/40">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              {conceptResults.length > 0 && (
                <SidebarGroup className="px-2">
                  <GroupLabel>Concepts</GroupLabel>
                  <SidebarMenu>
                    {conceptResults.map((concept) => {
                      const isActive = `${concept.categorySlug}/${concept.slug}` === active.concept;
                      return (
                        <SidebarMenuItem key={`${concept.categorySlug}/${concept.slug}`}>
                          <SidebarMenuButton
                            isActive={isActive}
                            className="gap-2.5 px-2 text-[13px]"
                            render={
                              <Link href={`/concepts/${concept.categorySlug}/${concept.slug}`} />
                            }
                          >
                            <span className="truncate">{concept.frontmatter.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroup>
              )}
              {lectureResults.length > 0 && (
                <SidebarGroup className="px-2">
                  <GroupLabel>Lectures</GroupLabel>
                  <SidebarMenu>
                    {lectureResults.map((lecture) => {
                      const isActive = lecture.slug === active.lecture;
                      return (
                        <SidebarMenuItem key={lecture.slug}>
                          <SidebarMenuButton
                            isActive={isActive}
                            className="gap-2.5 px-2 text-[13px]"
                            render={<Link href={`/lectures/${lecture.slug}`} />}
                          >
                            <span className="truncate">{lecture.frontmatter.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroup>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <SidebarGroup className="px-2">
            <GroupLabel>Concepts</GroupLabel>
            <SidebarMenu>
              {categories.map((category) => {
                const categoryActive = category.concepts.some(
                  (c) => `${category.slug}/${c.slug}` === active.concept
                );
                const open = isCategoryOpen(category.slug);
                return (
                  <SidebarMenuItem key={category.slug}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.slug)}
                      aria-expanded={open}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-sidebar-accent/70",
                        categoryActive
                          ? "text-sidebar-foreground/90"
                          : "text-sidebar-foreground/50"
                      )}
                    >
                      <FolderOpenIcon className="size-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{category.name}</span>
                      <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-sidebar-foreground/55">
                        {category.concepts.length}
                      </span>
                      <ChevronDownIcon
                        className={cn(
                          "size-3 shrink-0 text-sidebar-foreground/35 transition-transform duration-200 ease-out",
                          open && "rotate-180"
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-200 ease-out",
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="overflow-hidden">
                        <SidebarMenuSub>
                          {category.concepts.map((concept) => {
                            const isActive = `${category.slug}/${concept.slug}` === active.concept;
                            return (
                              <SidebarMenuSubItem key={concept.slug}>
                                <SidebarMenuSubButton
                                  isActive={isActive}
                                  className={cn("text-[13px]", isActive && "font-medium")}
                                  render={
                                    <Link href={`/concepts/${category.slug}/${concept.slug}`} />
                                  }
                                >
                                  {concept.frontmatter.title}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </div>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="px-2">
            <GroupLabel>Lectures</GroupLabel>
            <SidebarMenu>
              {lectures.map((lecture) => {
                const isActive = lecture.slug === active.lecture;
                return (
                  <SidebarMenuItem key={lecture.slug}>
                    <LecturePopover
                      lecture={lecture}
                      isOpen={activePopoverSlug === lecture.slug}
                      onOpen={() => setActivePopoverSlug(lecture.slug)}
                      onClose={() => setActivePopoverSlug((s) => s === lecture.slug ? null : s)}
                    >
                      <SidebarMenuButton
                        isActive={isActive}
                        className={cn("gap-2.5 px-2 text-[13px]", isActive && "font-medium")}
                        render={<Link href={`/lectures/${lecture.slug}`} />}
                      >
                        <span className="truncate">{lecture.frontmatter.title}</span>
                      </SidebarMenuButton>
                    </LecturePopover>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </>
      )}
    </SidebarContent>
  );
}