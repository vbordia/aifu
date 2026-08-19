import MiniSearch from "minisearch";

export type SearchDoc = {
  id: string;
  type: "concept" | "lecture";
  title: string;
  category: string;
  href: string;
  headings: string[];
  body: string;
};

export type SearchResult = {
  doc: SearchDoc;
  score: number;
  terms: string[];
  snippet: string;
};

const FIELDS = ["title", "category", "headings", "body"] as const;

const SEARCH_OPTIONS = {
  prefix: true,
  fuzzy: 0.2,
  boost: { title: 6, category: 5, headings: 3, body: 1 },
} as const;

export function createSearchIndex(docs: SearchDoc[]): MiniSearch<SearchDoc> {
  const index = new MiniSearch<SearchDoc>({
    fields: [...FIELDS],
    idField: "id",
    storeFields: ["id", "title", "category", "href", "type"],
    searchOptions: SEARCH_OPTIONS,
  });
  index.addAll(docs);
  return index;
}

export function searchIndex(
  index: MiniSearch<SearchDoc>,
  docs: SearchDoc[],
  query: string
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const docById = new Map(docs.map((doc) => [doc.id, doc]));
  const raw = index.search(q, { ...SEARCH_OPTIONS });

  return raw
    .slice(0, 40)
    .map((result) => {
      const doc = docById.get(result.id);
      if (!doc) return null;
      return {
        doc,
        score: result.score,
        terms: result.terms,
        snippet: makeSnippet(doc.body, q),
      } satisfies SearchResult;
    })
    .filter((r): r is SearchResult => r !== null);
}

function makeSnippet(body: string, query: string): string {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const lower = body.toLowerCase();

  let index = -1;
  for (const term of terms) {
    index = lower.indexOf(term);
    if (index >= 0) break;
  }

  const start = Math.max(0, index < 0 ? 0 : index - 55);
  const end = Math.min(body.length, start + 150);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < body.length ? "…" : "";
  return `${prefix}${body.slice(start, end).trim()}${suffix}`;
}