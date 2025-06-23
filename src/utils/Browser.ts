import { MessageAction } from '@/types';
import { logger } from '@/utils';

/**
 * Utility functions for dark mode detection and monitoring
 */

/**
 * Check if service worker script is ready
 * @returns Whether the service worker script is ready
 */
const isServiceWorkerScriptReady = async (): Promise<boolean> => {
  try {
    await chrome.runtime.sendMessage({ action: MessageAction.PING_SERVICE_WORKER });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Wait for the service worker script to be ready
 * @param maxAttempts - The maximum number of attempts
 * @param signal - Optional AbortSignal to cancel the operation
 * @returns Whether the service worker script is ready
 */
export const waitForServiceWorkerScriptReady = async (maxAttempts = 10, signal?: AbortSignal): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    if (signal?.aborted) {
      return false;
    }
    const isReady = await isServiceWorkerScriptReady();
    if (isReady) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
};

/**
 * Check if content script is ready
 * @returns Whether the content script is ready
 */
const isContentScriptReady = async (): Promise<boolean> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      return false;
    }

    /** Check if the tab exists before sending message */
    const tabExists = await chrome.tabs.get(tab.id).catch(() => null);
    if (!tabExists) {
      return false;
    }

    await chrome.tabs.sendMessage(tab.id, { action: MessageAction.PING_CONTENT_SCRIPT });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Wait for the content script to be ready
 * @param maxAttempts - The maximum number of attempts
 * @param signal - Optional AbortSignal to cancel the operation
 * @returns Whether the content script is ready
 */
export const waitForContentScriptReady = async (maxAttempts = 10, signal?: AbortSignal): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    if (signal?.aborted) {
      return false;
    }
    const isReady = await isContentScriptReady();
    if (isReady) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
};

/**
 * Theme detection for offscreen document
 */
export const detectTheme = async () => {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  logger.debug('🎨', '[ThemeUtils.ts]', '[detectTheme]', 'Theme detected', isDarkMode ? 'dark' : 'light');

  /** Check if the service worker script is ready */
  const isReady = await waitForServiceWorkerScriptReady();
  logger.debug('🎨', '[ThemeUtils.ts]', '[detectTheme]', 'ServiceWorker script is ready', isReady);
  if (!isReady) {
    logger.warn('🎨', '[ThemeUtils.ts]', '[detectTheme]', 'ServiceWorker script is not ready, skipping theme detection');
    return;
  }

  /** Send the message to the offscreen document */
  try {
    chrome.runtime.sendMessage({
      action: MessageAction.COLOR_SCHEME_CHANGED,
      payload: { isDarkMode },
    });
  } catch (error) {
    logger.error('🎨', '[ThemeUtils.ts]', '[detectTheme]', 'Failed to send theme detection message', error);
  }
};

/**
 * Update extension icon based on color scheme
 * @param isDarkMode - Whether the color scheme is dark
 */
export const updateExtensionIcon = async (isDarkMode: boolean) => {
  logger.debug('🎨', '[ThemeUtils.ts]', '[updateExtensionIcon]', 'Updating extension icon');

  try {
    const iconPath = isDarkMode ? '/icons/dark/' : '/icons/light/';
    await chrome.action.setIcon({
      path: {
        16: `${iconPath}icon16.png`,
        48: `${iconPath}icon48.png`,
        128: `${iconPath}icon128.png`,
      },
    });
    logger.debug('🎨', '[ThemeUtils.ts]', '[updateExtensionIcon]', 'Icon updated');
  } catch (error) {
    logger.error('🎨', '[ThemeUtils.ts]', '[updateExtensionIcon]', 'Failed to update extension icon', error);
  }
};

export const fileNameFromUrl = (url: string): string => {
  const urlObj = new URL(url);
  return urlObj.pathname.split('/').pop() || '';
};
