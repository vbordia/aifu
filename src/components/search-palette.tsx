"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BookOpenIcon,
  ClipboardListIcon,
  PlayCircleIcon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  createSearchIndex,
  searchIndex,
  type SearchDoc,
  type SearchResult,
} from "@/lib/search-client";

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const chunks = useMemo(() => {
    const lower = text.toLowerCase();
    const hits: [number, number][] = [];
    for (const term of terms) {
      const t = term.toLowerCase();
      if (!t) continue;
      let from = 0;
      let index = lower.indexOf(t, from);
      while (index !== -1) {
        hits.push([index, index + t.length]);
        from = index + t.length;
        index = lower.indexOf(t, from);
      }
    }
    hits.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const hit of hits) {
      const last = merged[merged.length - 1];
      if (last && hit[0] <= last[1]) {
        last[1] = Math.max(last[1], hit[1]);
      } else {
        merged.push(hit);
      }
    }
    const parts: { t: string; hit: boolean }[] = [];
    let pos = 0;
    for (const [start, end] of merged) {
      if (start > pos) parts.push({ t: text.slice(pos, start), hit: false });
      parts.push({ t: text.slice(start, end), hit: true });
      pos = end;
    }
    if (pos < text.length) parts.push({ t: text.slice(pos), hit: false });
    return parts;
  }, [text, terms]);

  return (
    <>
      {chunks.map((part, index) =>
        part.hit ? (
          <mark
            key={index}
            className="rounded-[2px] bg-foreground/[0.14] px-0.5 text-foreground"
          >
            {part.t}
          </mark>
        ) : (
          <span key={index}>{part.t}</span>
        )
      )}
    </>
  );
}

function ResultItem({
  result,
  onSelect,
}: {
  result: SearchResult;
  onSelect: () => void;
}) {
  const { doc, terms, snippet } = result;
  return (
    <CommandItem
      value={`${doc.title} ${doc.category} ${doc.headings.join(" ")}`}
      onSelect={onSelect}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06] text-foreground/55">
        {doc.type === "lecture" ? (
          <PlayCircleIcon className="size-4" />
        ) : doc.type === "quiz" ? (
          <ClipboardListIcon className="size-4" />
        ) : (
          <BookOpenIcon className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-foreground/85">
          <Highlight text={doc.title} terms={terms} />
        </span>
        {snippet && (
          <span className="mt-0.5 block truncate text-[12px] text-foreground/45">
            <span className="text-foreground/35">{doc.category}</span>
            {" · "}
            <Highlight text={snippet} terms={terms} />
          </span>
        )}
      </span>
    </CommandItem>
  );
}

export default function SearchPalette({ docs }: { docs: SearchDoc[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const index = useMemo(() => createSearchIndex(docs), [docs]);
  const results = useMemo(() => searchIndex(index, docs, query), [index, docs, query]);

  const concepts = results.filter((r) => r.doc.type === "concept");
  const lectures = results.filter((r) => r.doc.type == "lecture");
  const quizzes = results.filter((r) => r.doc.type === "quiz");
  const hasQuery = query.trim().length > 0;

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-foreground/55"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-foreground/[0.12] bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-foreground/45 sm:flex">
          âŒ˜K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : close())}
      >
        <CommandInput
          placeholder="Search concepts, lectures, question papers..."
        />
        <CommandList>
          {hasQuery && results.length === 0 && (
            <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
          )}
          {concepts.length > 0 && (
            <CommandGroup heading="Concepts">
              {concepts.map((result) => (
                <ResultItem
                  key={result.doc.id}
                  result={result}
                  onSelect={() => select(result.doc.href)}
                />
              ))}
            </CommandGroup>
          )}
          {lectures.length > 0 && (
            <>
              {concepts.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Lectures">
                {lectures.map((result) => (
                  <ResultItem
                    key={result.doc.id}
                    result={result}
                    onSelect={() => select(result.doc.href)}
                  />
                ))}
              </CommandGroup>
            </>
          )}
          {quizzes.length > 0 && (
            <>
              {(concepts.length > 0 || lectures.length > 0) && <CommandSeparator />}
              <CommandGroup heading="Question Papers">
                {quizzes.map((result) => (
                  <ResultItem
                    key={result.doc.id}
                    result={result}
                    onSelect={() => select(result.doc.href)}
                  />
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}