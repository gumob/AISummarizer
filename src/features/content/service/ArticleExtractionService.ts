import { db } from '@/db';
import { YoutubeTranscriptExtractor } from '@/features/content/extractors/YoutubeTranscriptExtractor';
import { ExtractionResult } from '@/types';
import { logger } from '@/utils';

import { ReadabilityExtractor } from '../extractors/ReadabilityExtractor';

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
        const { videoId, lang } = message;
        const result: ExtractionResult = await new YoutubeTranscriptExtractor().extract(videoId, lang);
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
      logger.debug('Extracting normal web page');
      const result = new ReadabilityExtractor().extract();
      logger.debug('extract result:', result);
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
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      // const [{ result }] = await chrome.scripting.executeScript({
      //   target: { tabId: tab.id! },
      //   func: () => {
      //     const service = new ReadabilityExtractor();
      //     return service.extract();
      //   },
      const result = new ReadabilityExtractor().extract();
      logger.debug('extractArticle result:', result);

      // if (result?.isSuccess) {
      //   await db.addArticle({
      //     url: tab.url as string,
      //     title: result.result?.title ?? null,
      //     content: result.result?.content ?? null,
      //     date: new Date(),
      //     is_extracted: true,
      //   });
      //   return true;
      // }
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
