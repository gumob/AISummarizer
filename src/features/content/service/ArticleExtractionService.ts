import { db } from '@/db';
import { logger } from '@/utils';

import { ReadabilityExtractor } from '../extractors/ReadabilityExtractor';

export class ArticleExtractionService {
  private pageArticleExtractionService: ReadabilityExtractor;

  constructor() {
    this.pageArticleExtractionService = new ReadabilityExtractor();
  }

  async extractArticle(tab: chrome.tabs.Tab) {
    if (!tab.id || !tab.url) return false;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => {
          const service = new ReadabilityExtractor();
          return service.extract();
        },
      });

      if (result?.isExtracted) {
        await db.addArticle({
          url: tab.url as string,
          title: result.title,
          content: result.content,
          date: new Date(),
          is_extracted: true,
        });
        return true;
      }
    } catch (error) {
      logger.error('Failed to extract article:', error);
      await db.addArticle({
        url: tab.url as string,
        title: null,
        content: null,
        date: new Date(),
        is_extracted: false,
      });
    }
    return false;
  }

  async checkArticleExtraction(url: string): Promise<boolean> {
    const article = await db.getArticleByUrl(url);
    return article?.is_extracted ?? false;
  }
}
