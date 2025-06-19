import { ArticleRecord } from '@/db';

export interface ArticleExtractionResult {
  title: string | null;
  url: string | null;
  content: string | null;
  isSuccess: boolean;
  error?: Error | null;
}

export interface ArticleInjectionResult {
  success: boolean;
  error?: Error | undefined;
}

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
