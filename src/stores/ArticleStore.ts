import { create } from 'zustand';

import { ArticleModel } from '@/models';

interface ArticleStore {
  activeArticle: ArticleModel | null;
  setActiveArticle: (article: ArticleModel) => void;
  isArticleExtractedForUrl: (url: string) => boolean;
}

export const useArticleStore = create<ArticleStore>((set, get) => ({
  activeArticle: null,
  setActiveArticle: (article: ArticleModel) => {
    set({ activeArticle: article });
  },
  isArticleExtractedForUrl: (url: string) => {
    const activeArticle = get().activeArticle;
    return activeArticle?.url === url;
  },
}));
