export interface ConceptFrontmatter {
  title: string;
  order: number;
  category: string;
  categoryOrder: number;
  description: string;
  tags?: string[];
  prerequisites?: string[];
}

export interface LectureFrontmatter {
  title: string;
  order: number;
  week?: number;
  lectures?: string[];
  date?: string;
  duration?: string;
  videoUrl?: string;
  description?: string;
  relatedConcepts?: string[];
}

export interface ContentFile {
  slug: string;
  categorySlug?: string;
  filePath: string;
  frontmatter: ConceptFrontmatter | LectureFrontmatter;
  headings: Heading[];
}

export interface ConceptFile extends ContentFile {
  frontmatter: ConceptFrontmatter;
  categorySlug: string;
}

export interface LectureFile extends ContentFile {
  frontmatter: LectureFrontmatter;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface Category {
  slug: string;
  name: string;
  order: number;
  description?: string;
  concepts: ConceptFile[];
}

export interface SidebarItem {
  title: string;
  slug: string;
  href: string;
  isActive: boolean;
  children?: SidebarItem[];
}

export interface RightPanelContent {
  type: "toc" | "related" | "info";
  headings?: Heading[];
  related?: { title: string; href: string; category?: string }[];
  info?: { label: string; value: string }[];
}
