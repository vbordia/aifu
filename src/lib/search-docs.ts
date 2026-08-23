import {
  getAllCategories,
  getAllLectures,
  getConceptContent,
  getLectureContent,
} from "@/lib/content";
import { getAllQuizPapers } from "@/lib/quiz";
import type { SearchDoc } from "@/lib/search-client";

function stripMarkdown(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$([^$]*)\$/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)([^*_]+)\1/g, "$2")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSearchDocuments(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const category of getAllCategories()) {
    for (const concept of category.concepts) {
      const content = getConceptContent(category.slug, concept.slug) ?? "";
      docs.push({
        id: `concept-${category.slug}-${concept.slug}`,
        type: "concept",
        title: concept.frontmatter.title,
        category: category.name,
        href: `/concepts/${category.slug}/${concept.slug}`,
        headings: concept.headings.map((h) => h.text),
        body: stripMarkdown(content),
      });
    }
  }

  for (const lecture of getAllLectures()) {
    const content = getLectureContent(lecture.slug) ?? "";
    docs.push({
      id: `lecture-${lecture.slug}`,
      type: "lecture",
      title: lecture.frontmatter.title,
      category: "Lecture",
      href: `/lectures/${lecture.slug}`,
      headings: lecture.headings.map((h) => h.text),
      body: stripMarkdown(content),
    });
  }

  for (const paper of getAllQuizPapers()) {
    const body = paper.items
      .map((item) => {
        const options = item.options?.map((o) => `${o.label}) ${o.text}`).join(" ") ?? "";
        return `${item.question} ${options}`;
      })
      .join(" ");
    docs.push({
      id: `quiz-${paper.slug}`,
      type: "quiz",
      title: paper.title,
      category: "Question Paper",
      href: `/quiz/${paper.slug}`,
      headings: [...new Set(paper.items.map((i) => i.label).filter((l): l is string => Boolean(l)))],
      body: stripMarkdown(body),
    });
  }

  return docs;
}