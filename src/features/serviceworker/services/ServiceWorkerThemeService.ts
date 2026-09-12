import { initThemeDetection } from '@/platform';
import { useThemeStore } from '@/stores/ThemeStore';
import { Message, MessageAction, MessageResponse } from '@/types';
import { logger } from '@/utils';

export class ServiceWorkerThemeService {
  constructor() {
    chrome.runtime.onMessage.removeListener(this.handleMessage.bind(this));
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  async initialize() {
    try {
      /** Chrome reports through the offscreen document (handleMessage); Firefox calls back directly */
      await initThemeDetection(isDarkMode => useThemeStore.getState().setDarkMode(isDarkMode));
    } catch (error) {
      logger.error('🧑‍🍳🎨', '[ServiceWorkerThemeService.tsx]', '[initialize]', 'Error in theme service initialization', error);
    }
  }

  private handleMessage(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) {
    switch (message.action) {
      case MessageAction.PING_SERVICE_WORKER:
        logger.debug('🧑‍🍳🎨', '[ServiceWorkerThemeService.tsx]', '[setupMessageListener]', 'Received PING_SERVICE_WORKER');
        sendResponse({ success: true });
        return true;
      case MessageAction.COLOR_SCHEME_CHANGED:
        logger.debug('🧑‍🍳🎨', '[ServiceWorkerThemeService.tsx]', '[setupMessageListener]', 'Color scheme changed');
        if (message.payload?.isDarkMode !== undefined) {
          useThemeStore.getState().setDarkMode(message.payload.isDarkMode);
        }
        sendResponse({ success: true });
        return true;
      default:
        return false;
    }
  }
}
