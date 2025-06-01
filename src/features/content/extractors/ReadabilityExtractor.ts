import { ExtractionResult } from '@/types';
import { logger } from '@/utils';
import { Readability } from '@mozilla/readability';

export class ReadabilityExtractor {
  extract(): ExtractionResult {
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
