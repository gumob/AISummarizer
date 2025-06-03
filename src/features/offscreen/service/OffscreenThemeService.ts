import { MessageAction } from '@/types';
import { logger } from '@/utils';

export class OffscreenThemeService {
  private mediaQuery: MediaQueryList;
  private isInitialized = false;

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  initialize() {
    if (this.isInitialized) return;

    logger.debug('Initializing theme detection service');
    logger.debug('Initial media query state:', this.mediaQuery.matches);

    // 初期状態の送信を少し遅延させる
    setTimeout(() => {
      logger.debug('Sending initial theme status');
      this.sendThemeStatus();
    }, 2000);

    // テーマ変更のリスナーを設定
    try {
      this.mediaQuery.addEventListener('change', this.handleThemeChange);
      logger.debug('Theme change listener added successfully');
    } catch (error) {
      logger.error('Failed to add theme change listener:', error);
    }

    this.isInitialized = true;
  }

  private sendThemeStatus = () => {
    const isDarkMode = this.mediaQuery.matches;
    logger.debug('isDarkMode', isDarkMode);

    try {
      chrome.runtime.sendMessage({ type: MessageAction.COLOR_SCHEME_CHANGED, isDarkMode }, response => {
        if (chrome.runtime.lastError) {
          logger.error('Failed to send theme status:', chrome.runtime.lastError);
          // 接続エラーの場合、少し待って再試行
          setTimeout(this.sendThemeStatus, 1000);
        } else {
          logger.debug('Theme status sent successfully');
        }
      });
    } catch (error) {
      logger.error('Failed to send theme status:', error);
      // エラーの場合、少し待って再試行
      setTimeout(this.sendThemeStatus, 1000);
    }
  };

  private handleThemeChange = (event: MediaQueryListEvent) => {
    logger.debug('Theme change detected:', event.matches ? 'dark' : 'light');
    this.sendThemeStatus();
  };

  cleanup() {
    if (!this.isInitialized) return;

    try {
      this.mediaQuery.removeEventListener('change', this.handleThemeChange);
      logger.debug('Theme change listener removed successfully');
    } catch (error) {
      logger.error('Failed to remove theme change listener:', error);
    }

    this.isInitialized = false;
  }
}
