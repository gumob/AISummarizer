import { useThemeStore } from '@/stores/ThemeStore';
import {
  Message,
  MessageAction,
  MessageResponse,
} from '@/types';
import { logger } from '@/utils';

export class ThemeService {
  constructor() {
    this.setupMessageListener();
  }

  async initialize() {
    try {
      // Close existing document if it exists
      if (await chrome.offscreen.hasDocument()) {
        await chrome.offscreen.closeDocument();
      }

      // Create new document with error handling
      try {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['MATCH_MEDIA' as chrome.offscreen.Reason],
          justification: 'Detect system color scheme changes',
        });
        logger.debug('🧑‍🍳🎨', '[ThemeService.tsx]', '[initialize]', 'Offscreen document created successfully');
      } catch (createError) {
        logger.error('🧑‍🍳🎨', '[ThemeService.tsx]', '[initialize]', 'Failed to create offscreen document', createError);
        // Continue execution even if offscreen document creation fails
      }
    } catch (error) {
      logger.error('🧑‍🍳🎨', '[ThemeService.tsx]', '[initialize]', 'Error in theme service initialization', error);
      // Continue execution even if initialization fails
    }
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
      switch (message.action) {
        case MessageAction.PING:
          logger.debug('🧑‍🍳🎨', '[ThemeService.tsx]', '[setupMessageListener]', 'Received PING');
          sendResponse({ success: true });
          return true;
        case MessageAction.COLOR_SCHEME_CHANGED:
          logger.debug('🧑‍🍳🎨', '[ThemeService.tsx]', '[setupMessageListener]', 'Color scheme changed');
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
