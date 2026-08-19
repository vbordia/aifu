import type { MDXComponents } from "mdx/types";
import Mermaid from "@/components/ui/mermaid";
import Callout from "@/components/mdx/callout";
import Quiz from "@/components/mdx/quiz";
import Accordion from "@/components/mdx/accordion";
import StateSpaceGraph from "@/components/mdx/state-space-graph";
import LectureVideos from "@/components/mdx/lecture-videos";
import AStarViz from "@/components/mdx/astar-viz";
import AStarExamQuestion from "@/components/mdx/astar-exam-question";

function isMermaidCode(children: React.ReactNode): string | null {
  if (!children || typeof children !== "object" || !("props" in children)) {
    return null;
  }
  const props = (children as { props: { className?: string; children?: React.ReactNode } }).props;
  if (!props?.className?.includes("language-mermaid")) return null;
  const raw = props.children;
  return typeof raw === "string" ? raw : null;
}

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="scroll-m-20 text-[26px] font-semibold leading-snug tracking-tight text-foreground/90">
      {children}
    </h1>
  ),
  h2: ({ children, id }) => (
    <h2
      id={id}
      className="scroll-m-20 text-[21px] font-semibold tracking-tight text-foreground/85 mt-10 mb-4 first:mt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3
      id={id}
      className="scroll-m-20 text-[17px] font-semibold tracking-tight text-foreground/80 mt-8 mb-3"
    >
      {children}
    </h3>
  ),
  h4: ({ children, id }) => (
    <h4
      id={id}
      className="scroll-m-20 text-[15px] font-medium tracking-tight text-foreground/75 mt-6 mb-2"
    >
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-[15px] leading-[1.85] text-foreground/65 mb-4">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 ml-5 list-disc text-[15px] leading-[1.85] text-foreground/65 space-y-1.5">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 ml-5 list-decimal text-[15px] leading-[1.85] text-foreground/65 space-y-1.5">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-[1.85] marker:text-foreground/40">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-r-lg border-l-2 border-foreground/[0.15] bg-foreground/[0.02] py-3 pl-4 pr-4 text-[14.5px] leading-[1.85] text-foreground/55 italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="rounded bg-foreground/[0.07] px-1.5 py-0.5 text-[12.5px] font-mono text-foreground/80">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }) => {
    const mermaidSource = isMermaidCode(children);
    if (mermaidSource !== null) {
      const wide = mermaidSource.trimStart().startsWith("%% wide");
      const chart = wide
        ? mermaidSource.trimStart().replace(/^%% wide\s*\n?/, "")
        : mermaidSource;
      return <Mermaid chart={chart.trim()} wide={wide} />;
    }
    return (
      <pre className="my-6 overflow-x-auto rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-4 text-[13px] font-mono leading-[1.75] text-foreground/70">
        {children}
      </pre>
    );
  },
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-foreground/[0.08]">
      <table className="w-full text-[13.5px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-foreground/[0.1] bg-foreground/[0.02]">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-foreground/[0.05]">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="transition-colors hover:bg-foreground/[0.02]">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3.5 py-2.5 text-left font-semibold text-foreground/70">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3.5 py-2.5 leading-[1.75] text-foreground/60">
      {children}
    </td>
  ),
  hr: () => <hr className="my-8 border-foreground/[0.07]" />,
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-foreground/80 underline underline-offset-[3px] decoration-foreground/[0.2] transition-colors hover:text-foreground hover:decoration-foreground/60"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground/90">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/60">{children}</em>
  ),
  Callout,
  Quiz,
  Accordion,
  StateSpaceGraph,
  LectureVideos,
  AStarViz,
  AStarExamQuestion,
};

export function useMDXComponents(): MDXComponents {
  return components;
}