import fs from "fs";
import path from "path";
import { parse } from "yaml";

const papersDir = path.join(process.cwd(), "AI_Search_Papers");

export type QuizOption = { label: string; text: string };

export type QuizItemType = "mcq" | "multi" | "short";

export type QuizItem = {
  id: string;
  label?: string;
  context?: string;
  type: QuizItemType;
  question: string;
  options?: QuizOption[];
  accepted: string[];
};

export type QuizPaper = {
  slug: string;
  fileName: string;
  title: string;
  items: QuizItem[];
};

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s.\[\]{}()"']/g, "")
    .replace(/\s*,\s*/g, ",")
    .trim();
}

type RawSub = {
  sub_id?: string | number;
  question_type?: string;
  type?: string;
  question?: string;
  options?: Record<string, string>;
  correct_option?: string;
  correct_options?: string[];
  correct_answer?: string;
  correct_answers?: string[];
};

type RawQuestion = RawSub & {
  id?: string | number;
  label?: string;
  description?: string;
  subquestions?: RawSub[];
};

function itemType(raw: RawSub): QuizItemType {
  const t = raw.question_type ?? raw.type ?? "";
  if (t.includes("multiple_select")) return "multi";
  if (t.includes("multiple_choice") || t === "mcq") return "mcq";
  return "short";
}

function optionsOf(raw: RawSub): QuizOption[] | undefined {
  if (!raw.options) return undefined;
  return Object.entries(raw.options).map(([label, text]) => ({
    label,
    text: String(text),
  }));
}

function acceptedOf(raw: RawSub, type: QuizItemType): string[] {
  if (type === "short") {
    const list = raw.correct_answers ?? (raw.correct_answer ? [raw.correct_answer] : []);
    return list.map((a) => normalize(String(a)));
  }
  if (raw.correct_options?.length) {
    return [normalize([...raw.correct_options].sort().join(","))];
  }
  if (raw.correct_option) {
    return [normalize(String(raw.correct_option))];
  }
  return [];
}

function toItem(
  raw: RawQuestion,
  fallbackId: string,
  context: string | undefined
): QuizItem | null {
  const question = raw.question?.trim();
  if (!question) return null;
  const type = itemType(raw);
  const accepted = acceptedOf(raw, type);
  if (accepted.length === 0) return null;
  return {
    id: String(raw.sub_id ?? raw.id ?? fallbackId),
    label: raw.label,
    context,
    type,
    question,
    options: optionsOf(raw),
    accepted,
  };
}

function paperMeta(fileName: string, data: Record<string, unknown>) {
  const match = fileName.match(/^(\d{2})T(\d)_(fn|an)\.yaml$/i);
  let title = fileName.replace(/\.yaml$/i, "");
  if (match) {
    const year = 2000 + parseInt(match[1], 10);
    const term = match[2];
    const session = match[3].toLowerCase() === "fn" ? "Forenoon" : "Afternoon";
    title = `${year} Term ${term} · ${session}`;
  }
  const subject = typeof data.subject === "string" ? data.subject : undefined;
  return { title, subject };
}

let cache: QuizPaper[] | null = null;

export function getAllQuizPapers(): QuizPaper[] {
  if (cache) return cache;
  if (!fs.existsSync(papersDir)) {
    cache = [];
    return cache;
  }
  const papers: QuizPaper[] = [];
  for (const file of fs.readdirSync(papersDir).sort()) {
    if (!file.toLowerCase().endsWith(".yaml")) continue;
    const filePath = path.join(papersDir, file);
    if (fs.statSync(filePath).size < 500) continue;
    let data: { questions?: RawQuestion[]; subject?: string };
    try {
      data = parse(fs.readFileSync(filePath, "utf-8")) as {
        questions?: RawQuestion[];
        subject?: string;
      };
    } catch {
      continue;
    }
    const slug = file.replace(/\.yaml$/i, "").toLowerCase().replace("_", "-");
    const items: QuizItem[] = [];
    for (const q of data.questions ?? []) {
      const context = q.description?.trim() || undefined;
      if (q.subquestions?.length) {
        for (const sub of q.subquestions) {
          const item = toItem(sub, `${q.id}.${items.length}`, context);
          if (item) {
            item.label = item.label ?? q.label;
            items.push(item);
          }
        }
      } else {
        const item = toItem(q, String(q.id ?? items.length), undefined);
        if (item) items.push(item);
      }
    }
    if (items.length === 0) continue;
    const meta = paperMeta(file, data);
    papers.push({
      slug,
      fileName: file,
      title: meta.title,
      items,
    });
  }
  cache = papers;
  return papers;
}

export function getQuizPaper(slug: string): QuizPaper | null {
  return getAllQuizPapers().find((p) => p.slug === slug) ?? null;
}
