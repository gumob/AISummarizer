import { chromeAPI } from '@/api';
import { ThemeStore } from '@/store';
import {
  Message,
  MessageResponse,
} from '@/types';
import { logger } from '@/utils';

export class BackgroundThemeService {
  constructor(private themeStore: ThemeStore) {}

  async initialize() {
    await this.setupOffscreenDocument();
    this.setupMessageListener();
  }

  private async setupOffscreenDocument() {
    try {
      if (await chromeAPI.hasOffscreenDocument()) {
        await chromeAPI.closeOffscreenDocument();
      }

      await chromeAPI.createOffscreenDocument('offscreen.html', ['MATCH_MEDIA' as chrome.offscreen.Reason], 'Detect system color scheme changes');
      logger.debug('Offscreen document created successfully');
    } catch (error) {
      logger.error('Failed to create offscreen document', error);
      throw error;
    }
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
      switch (message.type) {
        case 'PING':
          logger.debug('Received PING');
          sendResponse({ success: true });
          return true;
        case 'COLOR_SCHEME_CHANGED':
          logger.debug('Color scheme changed');
          if (message.payload?.isDarkMode !== undefined) {
            this.themeStore.setDarkMode(message.payload.isDarkMode);
          }
          sendResponse({ success: true });
          return true;
        default:
          return false;
      }
    });
  }
}
