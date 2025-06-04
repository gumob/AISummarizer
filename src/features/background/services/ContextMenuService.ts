import { MENU_ITEMS } from '@/models';
import { MessageAction } from '@/types';
import { logger } from '@/utils';

export class ContextMenuService {
  constructor() {
    this.setupClickHandler();
  }

  async createMenu() {
    try {
      logger.debug('📃', 'Creating context menu');
      await chrome.contextMenus.removeAll();

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url) {
        this.createFullMenu();
      } else {
        this.createBasicMenu();
      }
      // if (await useArticleStore.getState().isArticleExtractedForUrl(tab.url)) {
      // this.createBasicMenu();
      // } else {
      //   this.createFullMenu();
      // }
    } catch (error) {
      logger.error('Failed to create context menu:', error);
    }
  }

  private createFullMenu() {
    logger.debug('📃', 'Creating full menu');
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
    chrome.contextMenus.create({
      id: MENU_ITEMS.COPY.id,
      title: MENU_ITEMS.COPY.title,
      contexts: ['page' as chrome.contextMenus.ContextType],
      parentId: root,
    });

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
  }

  private createBasicMenu() {
    logger.debug('📃', 'Creating basic menu');
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
  }

  private setupClickHandler() {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (!tab?.id) return;

      switch (info.menuItemId) {
        case 'chatgpt':
          logger.debug('📃', 'ChatGPT clicked');
          break;
        case 'gemini':
          logger.debug('📃', 'Gemini clicked');
          break;
        case 'claude':
          logger.debug('📃', 'Claude clicked');
          break;
        case 'grok':
          logger.debug('📃', 'Grok clicked');
          break;
        case 'perplexity':
          logger.debug('📃', 'Perplexity clicked');
          break;
        case 'deepseek':
          logger.debug('📃', 'Deepseek clicked');
          break;
        case 'copy':
          logger.debug('📃', 'Copy clicked');
          break;
        case 'extract':
          logger.debug('📃', 'Extract clicked');
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
              url: tab.url!,
            });
          } catch (error: any) {
            logger.error('Failed to send message to content script:', error);
          }
          break;
        case 'settings':
          logger.debug('📃', 'Settings clicked');
          chrome.sidePanel.open({ windowId: tab.windowId });
          break;
      }
    });
  }
}
