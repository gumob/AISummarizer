import { extractReadability, extractYoutube } from '@/features/content/extractors';
import { ArticleExtractionResult } from '@/types';
import { isBrowserSpecificUrl, isExtractionDenylistUrl, logger } from '@/utils';

export class ArticleService {
  async execute(url: string, message: any = {}): Promise<ArticleExtractionResult> {
    logger.debug('🧑‍🍳📖', '[ArticleService.tsx]', '[execute]', 'extracting', '\nurl:', url, '\nmessage:', message);

    /**
     * Skip processing for browser-specific URLs
     */
    if (isBrowserSpecificUrl(url)) {
      logger.warn('🧑‍🍳📖', '[ArticleService.tsx]', '[execute]', 'Skipping extraction for browser-specific URLs', url);
      return {
        isSuccess: false,
        title: null,
        lang: null,
        url: url,
        content: null,
        error: new Error('Skipping extraction for browser-specific URLs'),
      };
    }

    /**
     * Skip processing for URLs in extractionDenylist
     */
    if (await isExtractionDenylistUrl(url)) {
      logger.warn('🧑‍🍳📖', '[ArticleService.tsx]', '[execute]', 'Skipping extraction for URLs in extractionDenylist');
      return {
        isSuccess: false,
        title: null,
        lang: null,
        url: url,
        content: null,
        error: new Error('Skipping extraction for URLs in extractionDenylist'),
      };
    }

    /**
     * YouTube
     */
    if (/^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/.test(url)) {
      logger.debug('🧑‍🍳📖', '[ArticleService.tsx]', '[execute]', 'Extracting youtube video');
      try {
        return await extractYoutube(url);
      } catch (error: any) {
        logger.error('🧑‍🍳📖', '[ArticleService.tsx]', '[execute]', 'Failed to extract youtube video:', error);
        return {
          isSuccess: false,
          title: null,
          lang: null,
          url: url,
          content: null,
          error: error instanceof Error ? error : new Error('Failed to extract article'),
        };
      }
    }

    /**
     * Normal web page
     */
    try {
      /** Extract article */
      logger.debug('🧑‍🍳📖', '[ArticleService.tsx]', '[execute]', 'Extracting normal web page');
      return await extractReadability(document);
    } catch (error: any) {
      logger.error('🧑‍🍳📖', '[ArticleService.tsx]', '[execute]', 'Failed to extract article:', error);
      return {
        isSuccess: false,
        title: null,
        lang: null,
        url: url,
        content: null,
        error: error instanceof Error ? error : new Error('Failed to extract article'),
      };
    }
  }
}
