import { OffscreenService } from '@/services/offscreen';
import { ThemeStore } from '@/store';
import {
  Message,
  MessageResponse,
} from '@/types';
import { logger } from '@/utils';

export class ThemeService {
  private offscreenService: OffscreenService;

  constructor(private themeStore: ThemeStore) {
    this.offscreenService = new OffscreenService();
  }

  async initialize() {
    await this.setupOffscreenDocument();
    this.setupMessageListener();
  }

  private async setupOffscreenDocument() {
    await this.offscreenService.createOffscreenDocument();
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
