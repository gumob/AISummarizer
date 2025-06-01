import { Readability } from '@mozilla/readability';

import { logger } from '@/utils';

export interface ExtractedArticle {
  title: string | null;
  content: string | null;
  isExtracted: boolean;
}

export class PageArticleExtractionService {
  extractArticle(): ExtractedArticle {
    try {
      const documentClone = document.cloneNode(true) as Document;
      const reader = new Readability(documentClone);
      const article = reader.parse();

      return {
        title: article?.title || null,
        content: article?.content || null,
        isExtracted: !!article,
      };
    } catch (error) {
      logger.error('Failed to extract article:', error);
      return {
        title: null,
        content: null,
        isExtracted: false,
      };
    }
  }
}
