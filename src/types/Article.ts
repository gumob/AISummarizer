import { ArticleRecord } from '@/db/Database';

export interface ArticleExtractionResult {
  title: string | null;
  lang: string | null;
  url: string | null;
  content: string | null;
  isSuccess: boolean;
  error?: Error | null;
}

// Function overload declarations
export function formatArticleForClipboard(article: ArticleRecord): string;
export function formatArticleForClipboard(article: ArticleExtractionResult): string;
// Function implementation
export function formatArticleForClipboard(article: ArticleRecord | ArticleExtractionResult): string {
  return `# Title
${article.title}

# URL
${article.url}

# Content
${article.content}
`;
}
