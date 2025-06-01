import { db } from '@/db';
import { logger } from '@/utils';
import { Readability } from '@mozilla/readability';

export class ArticleExtractionService {
  async extractArticle(tab: chrome.tabs.Tab) {
    if (!tab.id || !tab.url) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => {
          const documentClone = document.cloneNode(true) as Document;
          const reader = new Readability(documentClone);
          const article = reader.parse();
          return article;
        },
      });

      if (result) {
        await db.addArticle({
          url: tab.url as string,
          title: result.title ?? null,
          content: result.content ?? null,
          date: new Date(),
          is_extracted: true,
        });
        return true;
      }
    } catch (error) {
      logger.error('Failed to extract article:', error);
      await db.addArticle({
        url: tab.url,
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
