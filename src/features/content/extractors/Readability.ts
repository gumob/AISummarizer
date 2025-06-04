import { ArticleExtractionResult } from '@/types';
import { logger } from '@/utils';
import { Readability } from '@mozilla/readability';

export async function extractReadability(document: Document): Promise<ArticleExtractionResult> {
  try {
    const clonedDoc = document.cloneNode(true) as Document;
    const article = new Readability(clonedDoc).parse();
    logger.debug('extractReadability url:', document.URL);
    logger.debug('extractReadability article:', article);
    const textContent = article?.excerpt ? article?.excerpt + '\n' + article?.textContent : article?.textContent || null;
    const isSuccess = textContent !== null && textContent.length > 0;
    if (!isSuccess) {
      return {
        title: null,
        lang: null,
        url: null,
        textContent: null,
        isSuccess: false,
      };
    }

    return {
      title: article?.title || null,
      lang: article?.lang || null,
      url: document.URL,
      textContent: textContent || null,
      isSuccess: article?.textContent !== null,
    };
  } catch (error: unknown) {
    logger.error('Failed to extract article:', error);
    return {
      title: null,
      lang: null,
      url: null,
      textContent: null,
      isSuccess: false,
      error: error instanceof Error ? error : new Error('Failed to extract article with Readability'),
    };
  }
}
