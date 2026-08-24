import fs from "fs";
import path from "path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import type { Heading } from "./types";

const papersDir = path.join(process.cwd(), "src", "content", "papers");

export interface PaperQuestionFrontmatter {
  title: string;
  short?: string;
  order: number;
  paper: string;
  question: number;
  label?: string;
  topics?: string[];
  description?: string;
}

export interface PaperQuestion {
  slug: string;
  paperSlug: string;
  frontmatter: PaperQuestionFrontmatter;
  headings: Heading[];
}

export interface PaperInfo {
  slug: string;
  title: string;
  questions: PaperQuestion[];
}

function extractHeadings(rawContent: string): Heading[] {
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();
  for (const line of rawContent.split("\n")) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const text = match[2]
        .replace(/`([^`]*)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        .replace(/~~(.*?)~~/g, "$1")
        .trim();
      headings.push({ id: slugger.slug(text), text, level: match[1].length });
    }
  }
  return headings;
}

function paperTitleFromSlug(slug: string): string {
  const match = slug.match(/^(\d{2})t(\d)-(fn|an)$/i);
  if (!match) return slug;
  const year = 2000 + parseInt(match[1], 10);
  const session = match[3].toLowerCase() === "fn" ? "Forenoon" : "Afternoon";
  return `${year} Term ${match[2]} · ${session}`;
}

export function getAllPaperSlugs(): string[] {
  if (!fs.existsSync(papersDir)) return [];
  return fs
    .readdirSync(papersDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function getPaperQuestions(paperSlug: string): PaperQuestion[] {
  const dir = path.join(papersDir, paperSlug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const slug = f.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug,
        paperSlug,
        frontmatter: data as PaperQuestionFrontmatter,
        headings: extractHeadings(content),
      };
    })
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}

export function getPaperInfo(paperSlug: string): PaperInfo | null {
  const questions = getPaperQuestions(paperSlug);
  if (questions.length === 0) return null;
  return {
    slug: paperSlug,
    title: paperTitleFromSlug(paperSlug),
    questions,
  };
}

export function getPaperQuestion(
  paperSlug: string,
  questionParam: string
): PaperQuestion | null {
  const questions = getPaperQuestions(paperSlug);
  return (
    questions.find((q) => String(q.frontmatter.question) === questionParam) ??
    questions.find((q) => q.slug === questionParam) ??
    null
  );
}
