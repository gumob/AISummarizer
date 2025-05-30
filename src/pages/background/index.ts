import { chromeAPI } from '@/api';
import {
  logger,
  updateExtensionIcon,
} from '@/utils';

/**
 * Background script
 */

/**
 * Create and manage offscreen document
 */
const createOffscreenDocument = async () => {
  try {
    /** Close existing document */
    if (await chromeAPI.hasOffscreenDocument()) {
      await chromeAPI.closeOffscreenDocument();
    }

    /** Create new document */
    await chromeAPI.createOffscreenDocument('offscreen.html', ['MATCH_MEDIA' as chrome.offscreen.Reason], 'Detect system color scheme changes');
    logger.debug('Offscreen document created successfully');
  } catch (error) {
    logger.error('Failed to initialize extensions', error);
  }
};

/**
 * Initialize background script
 */
const initialize = async () => {
  logger.debug('Initializing background script');

  /**
   * Listen for theme changes from offscreen document
   */
  const handleColorSchemeChange = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
    switch (message.type) {
      /**
       * Keep service worker active
       */
      case 'PING':
        logger.debug('Received PING');
        sendResponse({ success: true });
        return true;
      /**
       * Theme detection from popup
       */
      case 'COLOR_SCHEME_CHANGED':
        logger.debug('Color scheme changed');
        updateExtensionIcon(message.isDarkMode);
        sendResponse({ success: true });
        return true;
      default:
        return false;
    }
  };

  /**
   * Create context menu
   */
  createContextMenu();

  /**
   * Remove existing listener and add new listener
   */
  chrome.runtime.onMessage.removeListener(handleColorSchemeChange);
  chrome.runtime.onMessage.addListener(handleColorSchemeChange);

  /**
   * Create offscreen document after listener is set
   */
  await createOffscreenDocument();
};

/**
 * Manage article extraction state
 */
let isArticleExtracted = false;

/**
 * Create context menu
 */
function createContextMenu() {
  logger.debug('Creating context menu');
  /**
   * Remove existing menu
   */
  chrome.contextMenus.removeAll();

  if (isArticleExtracted) {
    /**
     * Menu for when article extraction is available
     */
    const root = chrome.contextMenus.create(
      {
        title: 'Summarize this page with',
        id: 'root',
        contexts: ['page'],
      },
      function () {
        chrome.contextMenus.create({
          title: 'ChatGPT',
          parentId: root,
          id: 'chatgpt',
          contexts: ['page'],
        });
        chrome.contextMenus.create({
          title: 'Gemini',
          parentId: root,
          id: 'gemini',
          contexts: ['page'],
        });
        chrome.contextMenus.create({
          title: 'Claude',
          parentId: root,
          id: 'claude',
          contexts: ['page'],
        });
        chrome.contextMenus.create({
          title: 'Grok',
          parentId: root,
          id: 'grok',
          contexts: ['page'],
        });
        chrome.contextMenus.create({
          title: 'Deepseek',
          parentId: root,
          id: 'deepseek',
          contexts: ['page'],
        });
        chrome.contextMenus.create({
          type: 'separator',
          parentId: root,
          id: 'divider1',
          contexts: ['page'],
        });
        chrome.contextMenus.create({
          title: 'Settings',
          parentId: root,
          id: 'settings',
          contexts: ['page'],
        });
      }
    );
  } else {
    /**
     * Menu for when article extraction is not available
     */
    const root = chrome.contextMenus.create(
      {
        title: 'Not Available',
        id: 'root',
        contexts: ['page'],
      },
      function () {
        chrome.contextMenus.create({
          title: 'Settings',
          parentId: root,
          id: 'settings',
          contexts: ['page'],
        });
      }
    );
  }
}

/**
 * Context menu click event handler
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case 'chatgpt':
      logger.debug('ChatGPT clicked');
      break;
    case 'gemini':
      logger.debug('Gemini clicked');
      break;
    case 'claude':
      logger.debug('Claude clicked');
      break;
    case 'grok':
      logger.debug('Grok clicked');
      break;
    case 'deepseek':
      logger.debug('Deepseek clicked');
      break;
    case 'settings':
      chrome.runtime.openOptionsPage();
      break;
  }
});

/**
 * Update article extraction state
 */
export function updateArticleExtractionState(extracted: boolean) {
  isArticleExtracted = extracted;
  createContextMenu();
}

updateArticleExtractionState(true);

/**
 * Listen for extension installation
 */
chrome.runtime.onInstalled.addListener(async details => {
  logger.debug('Extension installed');
  await initialize();
});

/**
 * Listen for extension startup
 */
chrome.runtime.onStartup.addListener(async () => {
  logger.debug('Extension started');
  await initialize();
});
