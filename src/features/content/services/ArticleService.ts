import {
  extractReadability,
  extractYoutube,
} from '@/features/content/extractors';
import { useArticleStore } from '@/stores/ArticleStore';
import { ArticleExtractionResult } from '@/types';
import { logger } from '@/utils';

export class ArticleService {
  async execute(url: string, message: any = {}): Promise<ArticleExtractionResult> {
    logger.debug('extracting', '\nurl:', url, '\nmessage:', message);

    /**
     * Skip processing for browser-specific URLs
     */
    if (/^(chrome|brave|edge|opera|vivaldi):\/\//.test(url)) {
      logger.debug('Skipping extraction for browser-specific URLs');
      return {
        isSuccess: false,
        title: null,
        lang: null,
        url: url,
        textContent: null,
        error: new Error('Skipping extraction for browser-specific URLs'),
      };
    }

    /**
     * YouTube
     */
    if (/^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/.test(url)) {
      logger.debug('Extracting youtube video');
      try {
        /** Extract youtube video id from url */
        const match = url.match(/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/);
        const videoId = match ? match[1] : null;
        if (!videoId) {
          throw new Error('Could not extract video ID from URL');
        }

        /** Extract youtube video */
        const result = await extractYoutube(videoId);
        logger.debug('extractYoutube result:', result.textContent);

        if (result.isSuccess && result.title && result.textContent) {
          /** Add article to database */
          await useArticleStore.getState().addArticle({
            url: url,
            title: result.title,
            content: result.textContent,
            date: new Date(),
            is_success: true,
          });
          /** Return extraction result */
          return {
            ...result,
          };
        }

        logger.warn('Article is not extracted');
        return {
          isSuccess: false,
          title: null,
          lang: null,
          url: url,
          textContent: null,
          error: new Error('Article is not extracted'),
        };
      } catch (error: any) {
        return {
          isSuccess: false,
          title: null,
          lang: null,
          url: url,
          textContent: null,
          error: error instanceof Error ? error : new Error('Failed to extract article'),
        };
      }
    }

    /**
     * Normal web page
     */
    try {
      /** Extract article */
      logger.debug('Extracting normal web page');
      const result = await extractReadability(document);
      logger.debug('extract result:', result.textContent);

      if (result.isSuccess) {
        /** Add article to database */
        await useArticleStore.getState().addArticle({
          url: url,
          title: result.title,
          content: result.textContent ?? '',
          date: new Date(),
          is_success: true,
        });
        return {
          ...result,
        };
      }
      logger.warn('Article is not extracted');
      return {
        isSuccess: false,
        title: null,
        lang: null,
        url: url,
        textContent: null,
        error: new Error('Article is not extracted'),
      };
    } catch (error: any) {
      logger.error('Failed to extract article:', error);
      return {
        isSuccess: false,
        title: null,
        lang: null,
        url: url,
        textContent: null,
        error: error instanceof Error ? error : new Error('Failed to extract article'),
      };
    }
  }

  async isArticleExtractedForUrl(url: string): Promise<boolean> {
    return await useArticleStore.getState().isArticleExtractedForUrl(url);
  }
}
