<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# AIFU — Agent Instructions

## What This Project Is

AIFU is an educational site for an **AI Search** course (IIT Madras). It hosts lecture notes and interactive algorithm study pages. The target audience is students who may be cramming the night before an exam — everything must be simple, clear, and memorable.

**Language**: TypeScript / React / Next.js
**Package Manager**: pnpm
**Framework**: Next.js 16 (App Router, static export with `output: "export"`)

## Architecture

### Content System

All content lives in `src/content/` as MDX files:

- **Lectures**: `src/content/lectures/week-N.mdx` — week-by-week lecture notes
- **Concepts**: `src/content/concepts/week-NN-topic-name/NN-name.mdx` — algorithm pages organized by week

The content is loaded by `src/lib/content.ts` which reads directories, parses frontmatter with `gray-matter`, and extracts headings with `github-slugger`. Pages are generated via `generateStaticParams` in the route files under `src/app/(docs)/`.

### Route Structure

```
/concepts                          → lists all categories/weeks
/concepts/[category]               → lists concepts in a week
/concepts/[category]/[slug]        → individual concept page
/lectures                          → lists all weeks
/lectures/[slug]                   → individual week's notes
```

### MDX Components

Custom components are registered in `mdx-components.tsx` (root). Available components:

- `<Callout type="tip|important|warning|info" title="...">` — colored info boxes
- `<Quiz question="..." options={[...]} correctAnswer="B" explanation="..." />` — interactive MCQ
- `<Accordion title="...">` — collapsible section
- `<LectureVideos videos={{...}} />` — lecture video links
- `<AStarViz />` — A* step-by-step interactive trace
- `<AStarExamQuestion />` — exam practice with hidden solution

To add a new MDX component:
1. Create `"use client"` component in `src/components/mdx/`
2. Import and add it to the `components` object in `mdx-components.tsx`

### Cytoscape Graphs

Interactive graph visualizations use `src/components/ui/cytoscape.tsx`. Key rules:

- **Always use `layout={{ name: "preset" }}` with hardcoded `(x, y)` positions** — never use the `cose` layout for algorithm visualizations (nodes move between steps)
- **Dark saturated backgrounds with white text** — node colors must be readable in both light and dark themes. Use colors like `#15803d` (not `#4ade80`), `#b45309` (not `#fbbf24`), `#0369a1` (not `#38bdf8`)
- **No pan/zoom by default** — the component disables these automatically
- **Large nodes** — use `nodeWidth={120}`, `nodeHeight={68}`, `nodeFontSize={12}` for algorithm traces
- **Include legends and step info panels** — color legend + Current/Open/Closed list indicators below each graph

### Mermaid Diagrams

Rendered client-side by `src/components/ui/mermaid.tsx`. Uses `suppressHydrationWarning` and a `mounted` state guard to avoid hydration mismatches. The class name is `mermaid-output` (NOT `mermaid`) to prevent Mermaid's auto-processing.

### Math (KaTeX)

Configured in `next.config.ts` via `remark-math` + `rehype-katex`. Use `$...$` for inline, `$$...$$` for display. Import `katex/dist/katex.min.css` is in the root layout.

## Content Frontmatter

### Lecture Frontmatter

```yaml
title: "Week 2: State Space Search and Blind Search Algorithms"
week: 2
lectures:
  - "L21 - State Space Search"
  - "L22 - General Search Algorithms"
```

### Concept Frontmatter

```yaml
title: "A* Search Algorithm"
order: 1
category: "Week 3 — Heuristic Search"    # Display name for the sidebar
categoryOrder: 3                          # Sort order for categories
description: "Short description for listings"
tags: [a-star, heuristics, informed-search]
week: 3                                   # Links to lecture week
difficulty: intermediate                  # beginner | intermediate | advanced
```

The `category` folder name must match the directory name under `src/content/concepts/`. The display name in `category` is what appears in the UI.

## Writing Conventions

1. **Start with the simplest explanation** — something you could derive everything from even if you forgot all formulas
2. **Use tables for properties** — completeness, optimality, complexity
3. **Include worked examples with interactive visualizations** — students need to SEE the algorithm working
4. **Add exam practice questions** — Stanford/IIT difficulty, with hidden solutions
5. **Quizzes for quick conceptual checks** — use the `<Quiz>` component
6. **Common pitfalls in an Accordion** — the mistakes students actually make
7. **No comments in code** — unless explicitly asked

## Build & Verify

```bash
pnpm build   # Must pass — this generates the static site
pnpm lint    # Run before committing
```

Always run `pnpm build` after making changes to verify everything compiles and generates correctly.

## File Organization Rules

- **Concepts are organized by week**: `src/content/concepts/week-NN-topic-name/`
- **Naming convention**: `NN-descriptive-name.mdx` where NN is a zero-padded order number
- **One algorithm per file** — don't combine multiple algorithms in a single MDX
- **Interactive components** go in `src/components/mdx/` and must be `"use client"`
- **UI primitives** go in `src/components/ui/`
