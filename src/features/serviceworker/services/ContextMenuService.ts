import { MENU_ITEMS } from '@/models';
import { useSettingsStore } from '@/stores';
import { getAIServiceFromString } from '@/types';
import {
  isInvalidUrl,
  logger,
} from '@/utils';

export class ContextMenuService {
  constructor(onClick: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void) {
    chrome.contextMenus.onClicked.addListener(onClick.bind(this));
  }

  async createMenu(isExtracted: boolean, tabUrl?: string) {
    const { result, error } = await this.removeMenu();

    if (error) {
      logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createMenu]', 'Failed to remove context menu:', error);
      return;
    }

    const isInvalid = await isInvalidUrl(tabUrl);
    if (!tabUrl || isInvalid) {
      await this.createBasicMenu();
    } else {
      await this.createFullMenu(tabUrl, isExtracted);
    }
  }

  private async removeMenu(): Promise<{ result: boolean; error: Error | null }> {
    return new Promise(resolve => {
      try {
        chrome.contextMenus.removeAll(() => {
          logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[removeMenu]', '🗑️ Context menu removed');
          resolve({ result: true, error: null });
        });
      } catch (error) {
        logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[removeMenu]', '🗑️ Failed to remove context menu:', error);
        resolve({ result: false, error: error as Error });
      }
    });
  }

  private async createFullMenu(tabUrl: string, isExtracted: boolean) {
    try {
      logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createFullMenu]', '+ Creating full menu');
      const root = chrome.contextMenus.create({
        id: MENU_ITEMS.ROOT_ACTIVE.id,
        title: MENU_ITEMS.ROOT_ACTIVE.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
      });

      /** Create AI service menu items */
      for (const service of MENU_ITEMS.AI_SERVICES) {
        const isServiceOnMenu = await useSettingsStore.getState().getServiceOnMenu(getAIServiceFromString(service.id));
        if (isServiceOnMenu) {
          chrome.contextMenus.create({
            id: service.id,
            title: service.title,
            contexts: ['page' as chrome.contextMenus.ContextType],
            parentId: root,
          });
        }
      }

      /** Create first divider */
      chrome.contextMenus.create({
        type: 'separator',
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
        id: 'divider1',
      });

      /** Create copy option */
      if (tabUrl && isExtracted) {
        chrome.contextMenus.create({
          id: MENU_ITEMS.COPY.id,
          title: MENU_ITEMS.COPY.title,
          contexts: ['page' as chrome.contextMenus.ContextType],
          parentId: root,
        });
      }

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
      logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createFullMenu]', '+ Failed to create full menu:', error);
    }
  }

  private async createBasicMenu() {
    try {
      logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createBasicMenu]', '+ Creating basic menu');
      const root = chrome.contextMenus.create({
        id: MENU_ITEMS.ROOT_INACTIVE.id,
        title: MENU_ITEMS.ROOT_INACTIVE.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
      });
      chrome.contextMenus.create({
        id: MENU_ITEMS.SETTINGS.id,
        title: MENU_ITEMS.SETTINGS.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
      });
    } catch (error) {
      logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createBasicMenu]', '+ Failed to create basic menu:', error);
    }
  }
}
