import fs from "fs";
import path from "path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import type {
  ConceptFile,
  LectureFile,
  Category,
  Heading,
  ConceptFrontmatter,
  LectureFrontmatter,
} from "./types";

const contentDir = path.join(process.cwd(), "src", "content");
const conceptsDir = path.join(contentDir, "concepts");
const lecturesDir = path.join(contentDir, "lectures");

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx$/, "");
}

function numericPrefix(slug: string): { order: number; name: string } {
  const match = slug.match(/^(\d+)-(.+)$/);
  if (match) {
    return { order: parseInt(match[1], 10), name: match[2] };
  }
  return { order: 0, name: slug };
}

function extractHeadings(rawContent: string): Heading[] {
  const headings: Heading[] = [];
  const lines = rawContent.split("\n");
  const slugger = new GithubSlugger();

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2]
        .replace(/`([^`]*)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        .replace(/~~(.*?)~~/g, "$1")
        .trim();
      const id = slugger.slug(text);
      headings.push({ id, text, level });
    }
  }

  return headings;
}

function readMdxFile(
  filePath: string
): { frontmatter: Record<string, unknown>; rawContent: string; headings: Heading[] } {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const headings = extractHeadings(content);
  return { frontmatter: data, rawContent: content, headings };
}

export function getAllCategories(): Category[] {
  if (!fs.existsSync(conceptsDir)) return [];

  const categoryDirs = fs.readdirSync(conceptsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const categories: Category[] = [];

  for (const dirName of categoryDirs) {
    const dirPath = path.join(conceptsDir, dirName);
    const files = fs.readdirSync(dirPath)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => {
        const slug = slugFromFilename(f);
        const filePath = path.join(dirPath, f);
        const { frontmatter, headings } = readMdxFile(filePath);
        const { order } = numericPrefix(slug);

        return {
          slug,
          categorySlug: dirName,
          filePath,
          frontmatter: { ...frontmatter, order } as ConceptFrontmatter,
          headings,
        } satisfies ConceptFile;
      })
      .sort((a, b) => a.frontmatter.order - b.frontmatter.order);

    const categoryMeta = files[0]?.frontmatter;
    const { name: dirNameClean } = numericPrefix(dirName);

    categories.push({
      slug: dirName,
      name: categoryMeta?.category ?? dirNameClean,
      order: categoryMeta?.categoryOrder ?? 0,
      description: categoryMeta?.description,
      concepts: files,
    });
  }

  return categories.sort((a, b) => a.order - b.order);
}

export function getAllConcepts(): ConceptFile[] {
  const categories = getAllCategories();
  return categories.flatMap((c) => c.concepts);
}

export function getConceptBySlug(categorySlug: string, conceptSlug: string): ConceptFile | null {
  const filePath = path.join(conceptsDir, categorySlug, `${conceptSlug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const { frontmatter, headings } = readMdxFile(filePath);
  const { order } = numericPrefix(conceptSlug);

  return {
    slug: conceptSlug,
    categorySlug,
    filePath,
    frontmatter: { ...frontmatter, order } as ConceptFrontmatter,
    headings,
  };
}

export function getConceptContent(categorySlug: string, conceptSlug: string): string | null {
  const filePath = path.join(conceptsDir, categorySlug, `${conceptSlug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(raw);
  return content;
}

export function getAllLectures(): LectureFile[] {
  if (!fs.existsSync(lecturesDir)) return [];

  const files = fs.readdirSync(lecturesDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const slug = slugFromFilename(f);
      const filePath = path.join(lecturesDir, f);
      const { frontmatter, headings } = readMdxFile(filePath);
      const { order } = numericPrefix(slug);

      return {
        slug,
        filePath,
        frontmatter: { ...frontmatter, order } as LectureFrontmatter,
        headings,
      } satisfies LectureFile;
    })
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order);

  return files;
}

export function getLectureBySlug(lectureSlug: string): LectureFile | null {
  const filePath = path.join(lecturesDir, `${lectureSlug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const { frontmatter, headings } = readMdxFile(filePath);
  const { order } = numericPrefix(lectureSlug);

  return {
    slug: lectureSlug,
    filePath,
    frontmatter: { ...frontmatter, order } as LectureFrontmatter,
    headings,
  };
}

export function getLectureContent(lectureSlug: string): string | null {
  const filePath = path.join(lecturesDir, `${lectureSlug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(raw);
  return content;
}
