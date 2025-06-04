import { create } from 'zustand';

import {
  ArticleRecord,
  db,
} from '@/db/Database';
import { logger } from '@/utils';

interface ArticleStore {
  activeArticle: ArticleRecord | null;
  setActiveArticle: (article: ArticleRecord) => void;
  isArticleExtractedForUrl: (url: string) => Promise<boolean>;
  addArticle: (article: Omit<ArticleRecord, 'id'>) => Promise<string>;
  getArticleByUrl: (url: string) => Promise<ArticleRecord | undefined>;
  cleanup: () => Promise<void>;
  getLastCleanupDate: () => Promise<Date | null>;
}

export const useArticleStore = create<ArticleStore>((set, get) => ({
  activeArticle: null,
  setActiveArticle: (article: ArticleRecord) => {
    set({ activeArticle: article });
  },
  isArticleExtractedForUrl: async (url: string): Promise<boolean> => {
    // logger.debug('🏪🖼️','Checking if article is extracted for url:', url);
    const article = await get().getArticleByUrl(url);
    const result = article?.is_success ?? false;
    return result;
  },
  addArticle: async (article: Omit<ArticleRecord, 'id'>) => {
    try {
      // logger.debug('🏪🖼️','Adding article:', article);
      const id = await db.addArticle(article);
      return id;
    } catch (error) {
      logger.error('Failed to add article:', error);
      throw error;
    }
  },
  getArticleByUrl: async (url: string): Promise<ArticleRecord | undefined> => {
    try {
      // logger.debug('🏪🖼️','Getting article by url:', url);
      return await db.getArticleByUrl(url);
    } catch (error) {
      logger.error('Failed to get article:', error);
      throw error;
    }
  },
  cleanup: async () => {
    try {
      // logger.debug('🏪🖼️','Cleaning up database');
      await db.cleanup();
      // logger.debug('🏪🖼️','Database cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup:', error);
      throw error;
    }
  },
  getLastCleanupDate: async () => {
    try {
      // logger.debug('🏪🖼️','Getting last cleanup date');
      return await db.getLastCleanupDate();
    } catch (error) {
      logger.error('Failed to get last cleanup date:', error);
      throw error;
    }
  },
}));
