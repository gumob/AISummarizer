import { Readability } from '@mozilla/readability';

import { ExtractionResult } from '@/types';
import { logger } from '@/utils';

export async function extractReadability(document: Document): Promise<ExtractionResult> {
  try {
    const clonedDoc = document.cloneNode(true) as Document;
    const article = new Readability(clonedDoc).parse();
    logger.debug('extract:', article);
    const textContent = article?.excerpt ? article?.excerpt + '\n' + article?.textContent : article?.textContent;

    return {
      title: article?.title || null,
      lang: article?.lang || null,
      textContent: textContent || null,
      isExtracted: !!article,
    };
  } catch (error) {
    logger.error('Failed to extract article:', error);
    return {
      title: null,
      lang: null,
      textContent: null,
      isExtracted: false,
    };
  }
}
