import { ArticleExtractionResult } from '@/types';
import {
  logger,
  normalizeContent,
} from '@/utils';
import { Readability } from '@mozilla/readability';

export async function extractReadability(document: Document): Promise<ArticleExtractionResult> {
  try {
    const clonedDoc = document.cloneNode(true) as Document;
    const article = new Readability(clonedDoc).parse();
    logger.debug('📕', 'extractReadability url:', document.URL);
    // logger.debug('📕', 'extractReadability article:', article);
    const title = article?.title || null;
    const lang = article?.lang || null;
    const url = document.URL;
    const rawContent = article?.excerpt ? article?.excerpt + '\n' + article?.textContent : article?.textContent || null;
    const content = normalizeContent(rawContent);
    const isSuccess = title !== null && content !== null && content.length > 0;
    return {
      title: title,
      lang: lang,
      url: url,
      content: content,
      isSuccess: isSuccess,
    };
  } catch (error: unknown) {
    logger.error('📕', 'Failed to extract article:', error);
    return {
      title: null,
      lang: null,
      url: null,
      content: null,
      isSuccess: false,
      error: error instanceof Error ? error : new Error('Failed to extract article with Readability'),
    };
  }
}
