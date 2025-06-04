import { MessageAction } from '@/types';
import { logger } from '@/utils';

/**
 * Utility functions for dark mode detection and monitoring
 */

/**
 * Check if background script is ready
 * @returns Whether the background script is ready
 */
const isBackgroundScriptReady = async (): Promise<boolean> => {
  try {
    await chrome.runtime.sendMessage({ action: MessageAction.PING });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Theme detection for offscreen document
 */
export const detectTheme = async () => {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  logger.debug('Theme detected');

  /** Check if the background script is ready */
  const isReady = await isBackgroundScriptReady();
  if (!isReady) {
    logger.warn('Background script is not ready, skipping theme detection');
    return;
  }

  /** Send the message to the offscreen document */
  try {
    chrome.runtime.sendMessage({
      type: MessageAction.COLOR_SCHEME_CHANGED,
      isDarkMode: isDarkMode,
    });
  } catch (error) {
    logger.error('Failed to send theme detection message', error);
  }
};

/**
 * Update extension icon based on color scheme
 * @param isDarkMode - Whether the color scheme is dark
 */
export const updateExtensionIcon = async (isDarkMode: boolean) => {
  logger.debug('Updating extension icon');

  try {
    const iconPath = isDarkMode ? '/icons/dark/' : '/icons/light/';
    await chrome.action.setIcon({
      path: {
        16: `${iconPath}icon16.png`,
        48: `${iconPath}icon48.png`,
        128: `${iconPath}icon128.png`,
      },
    });
    logger.debug('Icon updated');
  } catch (error) {
    logger.error('Failed to update extension icon', error);
  }
};
