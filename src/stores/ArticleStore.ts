import { create } from 'zustand';

import { ArticleModel } from '@/models';

interface ArticleStore {
  articles: { [key: string]: ArticleModel };
  setArticles: (url: string, article: ArticleModel) => void;
  isArticleExtractedForUrl: (url: string) => boolean;
  isArticleExtracted: boolean;
}

export const useArticleStore = create<ArticleStore>((set, get) => ({
  isArticleExtracted: true,
  articles: {},
  setArticles: (url: string, article: ArticleModel) => {
    const articles = get().articles;
    articles[url] = article;
    set({ articles });
  },
  isArticleExtractedForUrl: (url: string) => {
    const articles = get().articles;
    return articles[url] != null;
  },
}));
