"use client";

import type { ReactNode } from "react";
import katex from "katex";
import Mermaid from "@/components/ui/mermaid";
import { cn } from "@/lib/utils";

type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; items: ListItem[] }
  | { kind: "table"; rows: string[][]; header: string[] | null }
  | { kind: "fence"; lang: string; content: string };

type ListItem = { level: number; text: string; ordered: boolean };

const INLINE =
  /(`[^`\n]+`)|(\$\$[\s\S]+?\$\$)|(\$[^$\n]+?\$)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)/g;

function renderMath(tex: string, display: boolean): ReactNode {
  let html: string;
  try {
    html = katex.renderToString(tex, {
      throwOnError: false,
      displayMode: display,
      output: "html",
    });
  } catch {
    return tex;
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function renderInline(text: string, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const tok = match[0];
    const k = `${keyPrefix}-${key++}`;
    if (tok.startsWith("`")) {
      out.push(
        <code
          key={k}
          className="rounded bg-foreground/[0.07] px-1.5 py-0.5 font-mono text-[12px] text-foreground/80"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("$$")) {
      out.push(<span key={k}>{renderMath(tok.slice(2, -2), true)}</span>);
    } else if (tok.startsWith("$")) {
      out.push(<span key={k}>{renderMath(tok.slice(1, -1), false)}</span>);
    } else if (tok.startsWith("**")) {
      out.push(
        <strong key={k} className="font-semibold text-foreground/90">
          {tok.slice(2, -2)}
        </strong>
      );
    } else {
      out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    }
    last = match.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function parseBlocks(source: string): Block[] {
  const lines = source.split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join("\n") });
      para = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      flushPara();
      const lang = line.replace(/^\s*```/, "").trim().toLowerCase();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      blocks.push({ kind: "fence", lang, content: body.join("\n") });
      continue;
    }

    if (/^\s*\|/.test(line)) {
      flushPara();
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = lines[i]
          .split("|")
          .slice(1)
          .map((c) => c.trim());
        if (!cells.every((c) => /^:?-{3,}:?$/.test(c) || c === "")) {
          rows.push(cells);
        }
        i++;
      }
      i--;
      const [header = null, ...rest] = rows;
      blocks.push({ kind: "table", rows: rest.length ? rest : rows, header: rest.length ? header : null });
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
    if (listMatch) {
      flushPara();
      const items: ListItem[] = [];
      while (i < lines.length) {
        const m2 = lines[i].match(/^(\s*)([-*])\s+(.*)$/);
        if (!m2) break;
        items.push({
          level: Math.floor(m2[1].replace(/\t/g, "  ").length / 2),
          text: m2[3],
          ordered: false,
        });
        i++;
      }
      i--;
      blocks.push({ kind: "list", items });
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushPara();
      continue;
    }

    para.push(line);
  }
  flushPara();
  return blocks;
}

function ListBlocks({ items }: { items: ListItem[] }) {
  const build = (
    start: number,
    level: number
  ): { nodes: ReactNode[]; next: number } => {
    const nodes: ReactNode[] = [];
    let j = start;
    while (j < items.length && items[j].level === level) {
      const text = renderInline(items[j].text, `li-${j}`);
      j++;
      let sub: ReactNode = null;
      if (j < items.length && items[j].level > level) {
        const res = build(j, items[j].level);
        sub = (
          <ul className="my-1 ml-5 list-disc space-y-1">{res.nodes}</ul>
        );
        j = res.next;
      }
      nodes.push(
        <li key={j}>
          {text}
          {sub}
        </li>
      );
    }
    return { nodes, next: j };
  };
  return <ul className="my-2 ml-5 list-disc space-y-1.5">{build(0, items[0]?.level ?? 0).nodes}</ul>;
}

function Blocks({ blocks, onMermaidClick }: { blocks: Block[]; onMermaidClick?: (chart: string) => void }) {
  return (
    <>
      {blocks.map((block, bi) => {
        if (block.kind === "p") {
          return (
            <p key={bi} className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/60">
              {renderInline(block.text, `b${bi}`)}
            </p>
          );
        }
        if (block.kind === "list") {
          return <ListBlocks key={bi} items={block.items} />;
        }
        if (block.kind === "table") {
          return (
            <div key={bi} className="overflow-x-auto rounded-lg border border-foreground/[0.08]">
              <table className="w-full text-[12.5px]">
                {block.header && (
                  <thead className="border-b border-foreground/[0.1] bg-foreground/[0.03]">
                    <tr>
                      {block.header.map((cell, ci) => (
                        <th key={ci} className="px-3 py-1.5 text-left font-semibold text-foreground/70">
                          {renderInline(cell, `h${bi}-${ci}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-foreground/[0.06]">
                  {(block.header ? block.rows : block.rows).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 leading-relaxed text-foreground/60">
                          {renderInline(cell, `c${bi}-${ri}-${ci}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.lang === "mermaid") {
          const raw = block.content.trim();
          const isWide = /^%%\s*wide\b/.test(raw);
          const chart = isWide ? raw.replace(/^%%\s*wide[ \t]*\n?/, "") : raw;
          return (
            <div
              key={bi}
              role={onMermaidClick ? "button" : undefined}
              tabIndex={onMermaidClick ? 0 : undefined}
              onClick={
                onMermaidClick
                  ? () => onMermaidClick(chart)
                  : undefined
              }
              onKeyDown={
                onMermaidClick
                  ? (e) => {
                      if (e.key === "Enter") onMermaidClick(chart);
                    }
                  : undefined
              }
              className={cn(
                "group relative",
                onMermaidClick && "cursor-zoom-in"
              )}
            >
              <Mermaid key={bi} chart={chart} wide={isWide} fit={!isWide} />
              {onMermaidClick && (
                <span className="pointer-events-none absolute right-2 top-2 rounded-md border border-foreground/[0.12] bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground/55 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
                  ⤢ Expand
                </span>
              )}
            </div>
          );
        }
        return (
          <pre
            key={bi}
            className="overflow-x-auto rounded-md bg-foreground/[0.05] p-3 font-mono text-[12px] leading-[1.6] text-foreground/70"
          >
            {block.content}
          </pre>
        );
      })}
    </>
  );
}

export default function LiteMarkdown({
  text,
  onMermaidClick,
}: {
  text: string;
  onMermaidClick?: (chart: string) => void;
}) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-2.5">
      <Blocks blocks={blocks} onMermaidClick={onMermaidClick} />
    </div>
  );
}
