import { ThemeState } from '@/types';
import { updateExtensionIcon } from '@/utils';

export class ThemeStore {
  private state: ThemeState = {
    isDarkMode: false,
  };

  private listeners: ((state: ThemeState) => void)[] = [];

  setDarkMode(isDark: boolean) {
    this.state.isDarkMode = isDark;
    updateExtensionIcon(isDark);
    this.notifyListeners();
  }

  getState(): ThemeState {
    return { ...this.state };
  }

  subscribe(listener: (state: ThemeState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}
