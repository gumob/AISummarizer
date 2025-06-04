import '@/styles/globals.css';

import React, {
  useEffect,
  useRef,
} from 'react';

import { createRoot } from 'react-dom/client';

import { ContentMain } from '@/features/content/components/main';
import { ArticleService } from '@/features/content/services';
import { GlobalContextProvider } from '@/stores';
import { MessageAction } from '@/types';
import {
  detectTheme,
  logger,
} from '@/utils';

logger.debug('Content script loaded');

const extractionService = new ArticleService();

const handleMessage = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  logger.debug('Received message:', message);

  switch (message.action) {
    case MessageAction.EXTRACT_CONTENT_START:
      try {
        const result = await extractionService.execute(message.url, message);
        sendResponse(result);
        chrome.runtime.sendMessage({
          action: MessageAction.EXTRACT_CONTENT_COMPLETE,
          result: result,
        });
        return true;
      } catch (error: any) {
        logger.error('Error in content script:', error);
        sendResponse({ error: error.message });
        return false;
      }
    case MessageAction.COPY_ARTICLE_TO_CLIPBOARD:
      await navigator.clipboard.writeText(message.payload.text);
      return true;
    default:
      return false;
  }
};

chrome.runtime.onMessage.removeListener(handleMessage);
chrome.runtime.onMessage.addListener(handleMessage);

/**
 * The main component for the content script.
 * @returns
 */
const Content: React.FC = () => {
  const isInitialized = useRef(false);

  /**
   * Setup color scheme listener.
   */
  useEffect(() => {
    const initialize = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      logger.debug('Initializing content document');
      await detectTheme();
    };

    initialize();

    return () => {
      isInitialized.current = false;
      logger.debug('Deinitializing content document');
    };
  }, []);

  /**
   * Render the component.
   * @returns
   */
  return (
    <GlobalContextProvider>
      <ContentMain />
    </GlobalContextProvider>
  );
};

// Create a container for the React app
const container = document.createElement('div');
container.id = 'ai-summarizer-root';
document.body.appendChild(container);

// Render the React app
const root = createRoot(container);
root.render(<Content />);
