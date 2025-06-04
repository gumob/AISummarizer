export interface ArticleExtractionResult {
  title: string | null;
  lang: string | null;
  url: string | null;
  content: string | null;
  isSuccess: boolean;
  error?: Error | null;
}

export const formatArticleForClipboard = (article: ArticleExtractionResult) => {
  return `# Title
${article.title}

# URL
${article.url}

# Content
${article.content}
`;
};
