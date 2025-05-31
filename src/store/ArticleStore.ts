import { ArticleState } from '@/types';

export class ArticleStore {
  private state: ArticleState = {
    isArticleExtracted: true,
  };

  private listeners: ((state: ArticleState) => void)[] = [];

  setArticleExtracted(extracted: boolean) {
    this.state.isArticleExtracted = extracted;
    this.notifyListeners();
  }

  getState(): ArticleState {
    return { ...this.state };
  }

  subscribe(listener: (state: ArticleState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}
