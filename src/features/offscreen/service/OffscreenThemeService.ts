import { MessageAction } from '@/types';
import { logger } from '@/utils';

/**
 * Service for detecting theme changes in the offscreen document
 * This service is used to detect theme changes in the offscreen document
 * and send the message to the service worker script
 *
 * @see https://developer.chrome.com/docs/extensions/reference/offscreen/
 * @see https://developer.chrome.com/docs/extensions/reference/runtime/
 */
export class OffscreenThemeService {
  /** Media query for detecting theme changes */
  private mediaQuery: MediaQueryList;
  /** Whether the service is initialized */
  private isInitialized = false;

  /**
   * Constructor
   * @param mediaQuery - Media query for detecting theme changes
   */
  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  /**
   * Initialize the service
   */
  initialize() {
    if (this.isInitialized) return;

    logger.debug('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[initialize]', 'Initializing theme detection service');
    logger.debug('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[initialize]', 'Initial media query state:', this.mediaQuery.matches);

    /** Send the initial theme status after a delay */
    setTimeout(() => {
      logger.debug('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[initialize]', 'Sending initial theme status');
      this.sendThemeStatus();
    }, 2000);

    /** Set up the theme change listener */
    try {
      this.mediaQuery.addEventListener('change', this.handleThemeChange);
      logger.debug('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[initialize]', 'Theme change listener added successfully');
    } catch (error) {
      logger.error('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[initialize]', 'Failed to add theme change listener:', error);
    }

    this.isInitialized = true;
  }

  /**
   * Cleanup the service
   */
  cleanup() {
    if (!this.isInitialized) return;

    try {
      this.mediaQuery.removeEventListener('change', this.handleThemeChange);
      logger.debug('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[cleanup]', 'Theme change listener removed successfully');
    } catch (error) {
      logger.error('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[cleanup]', 'Failed to remove theme change listener:', error);
    }

    this.isInitialized = false;
  }

  /**
   * Send the theme status to the service worker script
   */
  private sendThemeStatus = () => {
    const isDarkMode = this.mediaQuery.matches;
    logger.debug('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[sendThemeStatus]', 'isDarkMode', isDarkMode);

    try {
      chrome.runtime.sendMessage({ action: MessageAction.COLOR_SCHEME_CHANGED, payload: { isDarkMode } }, () => {
        if (chrome.runtime.lastError) {
          logger.error('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[sendThemeStatus]', 'Failed to send theme status:', chrome.runtime.lastError);
          /** If there is a connection error, wait a moment and try again */
          setTimeout(this.sendThemeStatus, 1000);
        } else {
          logger.debug('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[sendThemeStatus]', 'Theme status sent successfully');
        }
      });
    } catch (error) {
      logger.error('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[sendThemeStatus]', 'Failed to send theme status:', error);
      /** If there is an error, wait a moment and try again */
      setTimeout(this.sendThemeStatus, 1000);
    }
  };

  /**
   * Handle theme change
   * @param event - Media query list event
   */
  private handleThemeChange = (event: MediaQueryListEvent) => {
    logger.debug('🧑‍🍳🎨', '[OffscreenThemeService.ts]', '[handleThemeChange]', 'Theme change detected:', event.matches ? 'dark' : 'light');
    this.sendThemeStatus();
  };
}
