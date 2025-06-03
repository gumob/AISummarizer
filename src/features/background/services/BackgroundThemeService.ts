import { chromeAPI } from '@/api';
import { useThemeStore } from '@/stores/ThemeStore';
import {
  Message,
  MessageAction,
  MessageResponse,
} from '@/types';
import { logger } from '@/utils';

export class BackgroundThemeService {
  constructor() {
    this.setupMessageListener();
  }

  async initialize() {
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
      switch (message.action) {
        case MessageAction.PING:
          logger.debug('Received PING');
          sendResponse({ success: true });
          return true;
        case MessageAction.COLOR_SCHEME_CHANGED:
          logger.debug('Color scheme changed');
          if (message.payload?.isDarkMode !== undefined) {
            useThemeStore.getState().setDarkMode(message.payload.isDarkMode);
          }
          sendResponse({ success: true });
          return true;
        default:
          return false;
      }
    });
  }
}
