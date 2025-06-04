import {
  extractReadability,
  extractYoutube,
} from '@/features/content/extractors';
import { useArticleStore } from '@/stores';
import { ArticleExtractionResult } from '@/types';
import { logger } from '@/utils';

export class ArticleService {
  async execute(url: string, message: any = {}): Promise<ArticleExtractionResult> {
    logger.debug('🧑‍🍳📖', 'extracting', '\nurl:', url, '\nmessage:', message);

    /**
     * Skip processing for browser-specific URLs
     */
    if (/^(chrome|brave|edge|opera|vivaldi)/.test(url)) {
      logger.debug('🧑‍🍳📖', 'Skipping extraction for browser-specific URLs');
      return {
        isSuccess: false,
        title: null,
        lang: null,
        url: url,
        content: null,
        error: new Error('Skipping extraction for browser-specific URLs'),
      };
    }
    if (/(https?)\:\/\/(www\.)?(chatgpt\.com|gemini\.com|grok\.com|perplexity\.com|deepseek\.com|claude\.ai)/.test(url)) {
      logger.debug('🧑‍🍳📖', 'Skipping extraction for AI service URLs');
      return {
        isSuccess: false,
        title: null,
        lang: null,
        url: url,
        content: null,
        error: new Error('Skipping extraction for AI service URLs'),
      };
    }

    /**
     * YouTube
     */
    if (/^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/.test(url)) {
      logger.debug('🧑‍🍳📖', 'Extracting youtube video');
      try {
        /** Extract youtube video id from url */
        const match = url.match(/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/);
        const videoId = match ? match[1] : null;
        if (!videoId) {
          throw new Error('Could not extract video ID from URL');
        }
        return await extractYoutube(videoId);
      } catch (error: any) {
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
      logger.debug('🧑‍🍳📖', 'Extracting normal web page');
      return await extractReadability(document);
    } catch (error: any) {
      logger.error('🧑‍🍳📖', 'Failed to extract article:', error);
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

  async isArticleExtractedForUrl(url: string): Promise<boolean> {
    return await useArticleStore.getState().isArticleExtractedForUrl(url);
  }
}
