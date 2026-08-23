"use client";

import type { ReactNode } from "react";
import katex from "katex";
import Mermaid from "@/components/ui/mermaid";

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
  const build = (level: number, start: number): { node: ReactNode; next: number } => {
    const children: ReactNode[] = [];
    let j = start;
    while (j < items.length && items[j].level >= level) {
      if (items[j].level > level) {
        const sub = build(items[j].level, j);
        const parent = children.pop();
        children.push(
          <li key={`g-${j}`}>
            {parent}
            <ul className="ml-5 list-disc space-y-1">{sub.node}</ul>
          </li>
        );
        j = sub.next;
      } else {
        children.push(<li key={j}>{renderInline(items[j].text, `li-${j}`)}</li>);
        j++;
      }
    }
    return { node: <>{children}</>, next: j };
  };
  return <ul className="my-2 ml-5 list-disc space-y-1.5">{build(0, 0).node}</ul>;
}

function Blocks({ blocks }: { blocks: Block[] }) {
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
          return <Mermaid key={bi} chart={block.content.trim()} fit />;
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

export default function LiteMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-2.5">
      <Blocks blocks={blocks} />
    </div>
  );
}
