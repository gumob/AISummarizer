import { ExtractionResult } from '@/types';
import { logger } from '@/utils';
import { Readability } from '@mozilla/readability';

export class ReadabilityExtractor {
  extract(): ExtractionResult {
    try {
      const clonedDoc = document.cloneNode(true) as Document;
      const article = new Readability(clonedDoc).parse();
      logger.debug('ReadabilityExtractor extract:', article?.title);
      logger.debug('ReadabilityExtractor extract:', article?.textContent);

      return {
        title: article?.title || null,
        content: article?.textContent || null,
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
