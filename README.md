# AIFU — AI Search Course Notes

Interactive study material for the **AI Search** course. Built for students who want to understand algorithms, not just memorize them.

> Open this the night before the exam and pass. No lectures required.

## What's Inside

- **9 weeks of lecture notes** — from the history of AI to constraint processing, transcribed and organized
- **Interactive algorithm visualizations** — step through A* search, see open/closed lists update in real time, practice with exam-level questions
- **Math rendered properly** — KaTeX for formulas, Mermaid for diagrams, Cytoscape for interactive graphs
- **Dark mode** — because you're studying at 2 AM

## Content Map

| Week | Topic | Concepts |
|------|-------|----------|
| 1 | Introduction, History & Philosophy | — |
| 2 | State Space Search & Blind Search | DFS, BFS, DFID |
| 3 | Heuristic Search & Local Search | Best First, Hill Climbing, A* |
| 4 | Population-Based Methods | Genetic Algorithms, ACO |
| 5 | A* Variants & Space-Saving | IDA*, SMA*, RBFS |
| 6 | Sequence Alignment | Dynamic Programming, Bioinformatics |
| 7 | Game Playing | Minimax, Alpha-Beta |
| 8 | Planning & AO* | Forward/Backward Search |
| 9 | Constraint Processing | Arc Consistency, Backtracking |

## Tech Stack

- **Next.js 16** — App Router, static export
- **MDX** — write content with React components
- **KaTeX** — math rendering
- **Mermaid** — static diagrams
- **Cytoscape.js** — interactive graph visualizations
- **Tailwind CSS v4** — styling

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Project Structure

```
src/
  app/                    # Next.js App Router pages
  components/
    mdx/                  # Custom MDX components (Callout, Quiz, AStarViz, etc.)
    ui/                   # UI primitives (CytoscapeGraph, Mermaid, etc.)
  content/
    lectures/             # Week-by-week lecture notes (MDX)
    concepts/             # Algorithm study pages organized by week (MDX)
  lib/
    content.ts            # Content loading and parsing
    types.ts              # TypeScript interfaces
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on adding content, creating interactive visualizations, and the writing style.

## License

Educational use only. Lecture content is derived from course materials at IIT Madras.
