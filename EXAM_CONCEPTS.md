# AIFU — Exam Concept Inventory (AI: Search Methods for Problem Solving)

This file maps **what the actual question papers ask** (from `AI_Search_Papers/*.yaml` — all 20 sessions from 22T3 through 26T1) to the concept pages on this site. Use it to prioritize study and track coverage.

## Papers Analyzed

All 20 YAML files (2022T3 → 2026T1, forenoon + afternoon sessions), ~320 subquestions total. Every asked topic is mapped below.

| Recurring paper template (~85% of marks) | Coverage |
|------------------------------------------|----------|
| Q1: Best First / A* / BnB / DFS paths on a weighted grid map + "which finds shortest" + admissibility verdict | `/concepts/week-03-heuristic-search/09-best-first-search`, `01-a-star-search`, `06-dijkstra`, `08-optimal-path-algorithms` |
| Q2: TSP B&B tree (refinement order/count, tour node+cost, #cities, tour path) | `/concepts/week-05-optimal-tsp/01-bnb-tree-reading` |
| Q3: Games — strategies, best-strategy leaves, α-β pruned/inspected lists, SSS* solved/pruned | `/concepts/week-07-game-search/*` |
| Q4: AO* — expansion order, backed-up S values per expansion, final value, admissibility verdict | `/concepts/week-09-goal-trees/01-aostar-goal-trees` |
| Q5: Rete — conflict set, Specificity, Recency | `/concepts/week-10-rule-based/01-rete-algorithm` |
| Q6/Q7: Blocks World applicable/relevant + planning-graph mutexes L1 | `/concepts/week-08-planning/01-blocks-world-strips`, `/concepts/week-09-goal-trees/02-graphplan-mutexes` |
| Rotating extras: Waltz NIL labeling, Forward Checking, water jug, theory MCQs | `/concepts/week-11-constraint-satisfaction/*`, `/01-move-gen`, `/04-dfid`, `/02-weighted-a-star` |

### Inverse/tricky variants (all covered)

| Variant | Page |
|---------|------|
| Force MinMax value by changing ONE leaf (`E,98`; `B,36`) — 23T1 | `/concepts/week-07-game-search/05-force-minmax-value` (+ interactive demo) |
| Inverse α-β assignment to maximize cuts (`1,3,2,4` / `3,1,4,2`) — 26T1 | `/concepts/week-07-game-search/04-alphabeta-optimal-assignment` |
| Cutoff-type classification + parity-constrained evals — 25T3 | `/concepts/week-07-game-search/02-alpha-beta-pruning`, `/04-alphabeta-optimal-assignment` |
| α-β **inspected** leaves (complement of pruned) — 25T2 | `/concepts/week-07-game-search/02-alpha-beta-pruning` |
| Chronological "first five pruned" ordering — 23T3 | `/concepts/week-07-game-search/02-alpha-beta-pruning` |
| Leaves not affecting game value under perfect play — 24T3 | `/concepts/week-07-game-search/03-game-strategies` |
| Mid-flight GraphPlan layers: state-check, applicability in k+1, mutex propagation incl. nops — 25T3 | `/concepts/week-09-goal-trees/04-graphplan-midflight-layers` |
| NOP-action mutex distractors — 24 papers | `/concepts/week-09-goal-trees/02-graphplan-mutexes` |
| Map-colouring CSP arc/path consistency + solution tuple — 25T2/T3 | `/concepts/week-11-constraint-satisfaction/03-csp-relations-arc-consistency` |
| Water jug move-sequence answers (`aFb,bFc,...`) — 23T3 AN | `/concepts/week-02-blind-search/01-move-gen` |

## Lecture Coverage Status

All lecture topics now have pages. Week 1 (history/Turing/ML overview) is intentionally out of scope — no paper has ever asked it. Local search family (hill climbing, SAT landscape, simulated annealing, GA, GA-for-TSP, ACO), memory-bounded family (SMGS, sequence alignment, beam stack/BFHS, monotone condition), planning tail (POP, means-ends, logic chaining) and game evaluation functions are all in place.

## Question Formats to Practice

1. **Strict-format short answers** — comma-separated paths/lists (`NO SPACES, TABS...`). Match the format exactly; use `NIL` when undeterminable.
2. **Trace tables** — expansion/refinement order with explicit tie-breakers (alphabetical; leftmost-then-deepest; ascending labels).
3. **Property MCQs** — completeness/optimality per algorithm; DFID variants; wA* endpoints; mutex monotonicity.
4. **Multiple-select "guaranteed optimal"** — memorize the master table in `08-optimal-path-algorithms`.
5. **Numeric backups** — minimax values, AO* propagated S-values, B&B lower bounds.
6. **Inverse design** (2026 trend) — assign leaf evals to maximize α/β cuts; see `04-alphabeta-optimal-assignment`.

## Site Category Map

```
/concepts
├── week-02-blind-search       → MoveGen, DFS, BFS, DFID
├── week-03-heuristic-search   → A*, WA*, SSS*, TSP, B&B, Dijkstra, SMA*, optimal-path guide, Best First
├── week-04-local-search       → Hill Climbing, SAT Solution Space, Simulated Annealing, GA, GA-for-TSP, ACO
├── week-05-optimal-tsp        → Reading TSP B&B trees
├── week-06-memory-bounded     → SMGS/Frontier, Sequence Alignment, Beam Stack/BFHS, Monotone Condition
├── week-07-game-search        → Minimax, Alpha-Beta, Strategies, Inverse Assignment, Force-MinMax, Eval Functions
├── week-08-planning           → STRIPS Blocks World (+multi-arm), Goal Stack + Sussman, POP/Plan-Space
├── week-09-goal-trees         → AND-OR/AO*, GraphPlan Mutexes, Ordering Theory, Mid-flight Layers,
│                                 Means-Ends Analysis, Logic Chaining/Deduction
├── week-10-rule-based         → Rete Algorithm
└── week-11-constraint-satisfaction → Forward Checking, Waltz, Arc/Path Consistency
```
