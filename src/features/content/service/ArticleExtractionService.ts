import { db } from '@/db';
import { extractReadability, extractYoutube } from '@/features/content/extractors';
import { ExtractionResult } from '@/types';
import { logger } from '@/utils';

interface ExtractionServiceResult {
  isSuccess: boolean;
  result?: ExtractionResult | null;
  error?: Error | null;
}

export class ArticleExtractionService {
  async execute(url: string, message: any = {}): Promise<ExtractionServiceResult> {
    logger.debug('extracting', '\nurl:', url, '\nmessage:', message);

    /**
     * Skip processing for browser-specific URLs
     */
    if (/^(chrome|brave|edge|opera|vivaldi):\/\//.test(url)) {
      logger.debug('Skipping extraction for browser-specific URLs');
      return {
        isSuccess: false,
        result: null,
        error: null,
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

        /** Add article to database */
        await db.addArticle({
          url: url,
          title: result.title,
          content: result.textContent,
          date: new Date(),
          is_extracted: true,
        });
        /** Return extraction result */
        return {
          isSuccess: true,
          result,
        };
      } catch (error: any) {
        return {
          isSuccess: false,
          error: error,
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

      /** Add article to database */
      await db.addArticle({
        url: url,
        title: result.title,
        content: result.textContent,
        date: new Date(),
        is_extracted: true,
      });
      return {
        isSuccess: true,
        result,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error,
      };
    }
  }

  async _extractArticle(tab: chrome.tabs.Tab) {
    if (!tab.id || !tab.url) return false;

    try {
      const result = await extractReadability(document);
      logger.debug('extractArticle result:', result);
    } catch (error) {
      logger.error('Failed to extract article:', error);
      // await db.addArticle({
      //   url: tab.url as string,
      //   title: null,
      //   content: null,
      //   date: new Date(),
      //   is_extracted: false,
      // });
    }
    return false;
  }

  async checkArticleExtraction(url: string): Promise<boolean> {
    const article = await db.getArticleByUrl(url);
    return article?.is_extracted ?? false;
  }
}
