import { MENU_ITEMS } from '@/models';
import { AIService, getAIServiceFromId, MessageAction } from '@/types';
import { isBrowserSpecificUrl, isExtractionDenylistUrl, logger } from '@/utils';

export class ContextMenuService {
  private aiServiceCallback: (service: AIService, tabId: number, url: string) => void;
  constructor(aiServiceCallback: (service: AIService, tabId: number, url: string) => void) {
    this.aiServiceCallback = aiServiceCallback;
    this.setupClickHandler();
  }

  async createMenu() {
    await this.removeMenu();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url && !isBrowserSpecificUrl(tab.url) && !(await isExtractionDenylistUrl(tab.url))) {
      this.createFullMenu();
    } else {
      this.createBasicMenu();
    }
  }

  private async removeMenu() {
    try {
      await chrome.contextMenus.removeAll();
    } catch (error) {
      logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[removeMenu]', 'Failed to remove context menu:', error);
    }
  }

  private createFullMenu() {
    try {
      logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createFullMenu]', 'Creating full menu');
      const root = chrome.contextMenus.create({
        id: MENU_ITEMS.ROOT.id,
        title: MENU_ITEMS.ROOT.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
      });

      /** Create AI service menu items */
      for (const service of MENU_ITEMS.AI_SERVICES) {
        chrome.contextMenus.create({
          id: service.id,
          title: service.title,
          contexts: ['page' as chrome.contextMenus.ContextType],
          parentId: root,
        });
      }

      /** Create first divider */
      chrome.contextMenus.create({
        type: 'separator',
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
        id: 'divider1',
      });

      /** Create copy option */
      // chrome.contextMenus.create({
      //   id: MENU_ITEMS.COPY.id,
      //   title: MENU_ITEMS.COPY.title,
      //   contexts: ['page' as chrome.contextMenus.ContextType],
      //   parentId: root,
      // });

      /** Create extract option */
      chrome.contextMenus.create({
        id: MENU_ITEMS.EXTRACT.id,
        title: MENU_ITEMS.EXTRACT.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
      });

      /** Create second divider */
      chrome.contextMenus.create({
        type: 'separator',
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
        id: 'divider2',
      });

      /** Create settings option */
      chrome.contextMenus.create({
        id: MENU_ITEMS.SETTINGS.id,
        title: MENU_ITEMS.SETTINGS.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
      });
    } catch (error) {
      logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createFullMenu]', 'Failed to create full menu:', error);
    }
  }

  private createBasicMenu() {
    try {
      logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createBasicMenu]', 'Creating basic menu');
      const root = chrome.contextMenus.create({
        id: MENU_ITEMS.NOT_AVAILABLE.id,
        title: MENU_ITEMS.NOT_AVAILABLE.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
      });
      chrome.contextMenus.create({
        id: MENU_ITEMS.SETTINGS.id,
        title: MENU_ITEMS.SETTINGS.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
      });
    } catch (error) {
      logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createBasicMenu]', 'Failed to create basic menu:', error);
    }
  }

  private setupClickHandler() {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (!tab?.id) return;

      switch (info.menuItemId) {
        case 'chatgpt':
        case 'gemini':
        case 'claude':
        case 'grok':
        case 'perplexity':
        case 'deepseek':
        case 'copy':
          logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[setupClickHandler]', 'Extract clicked');
          try {
            /** Check if the content script is injected */
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[setupClickHandler]', 'Tab:', tab);
            if (tab.id === undefined || tab.id === null || tab.url === undefined || tab.url === null) throw new Error('No active tab found');

            this.aiServiceCallback(getAIServiceFromId(info.menuItemId), tab.id, tab.url);
          } catch (error) {
            logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[setupClickHandler]', 'Failed to send message:', error);
          }

          break;
        case 'extract':
          logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[setupClickHandler]', 'Extract clicked');
          try {
            /** Check if the content script is injected */
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.id === undefined || tab.id === null) throw new Error('No active tab found');

            /** Inject the content script */
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js'],
            });

            /** Send the message to the content script */
            await chrome.tabs.sendMessage(tab.id, {
              action: MessageAction.EXTRACT_CONTENT_START,
              payload: { tabId: tab.id, url: tab.url },
            });
          } catch (error: any) {
            logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[setupClickHandler]', 'Failed to send message to content script:', error);
          }
          break;
        case 'settings':
          logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[setupClickHandler]', 'Settings clicked');
          chrome.sidePanel.open({ windowId: tab.windowId });
          break;
      }
    });
  }
}
