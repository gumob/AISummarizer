import { create } from 'zustand';

import { ArticleState } from '@/types';

interface ArticleStore extends ArticleState {
  setArticleExtracted: (extracted: boolean) => void;
}

export const useArticleStore = create<ArticleStore>(set => ({
  isArticleExtracted: true,
  setArticleExtracted: extracted => set({ isArticleExtracted: extracted }),
}));
