import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { ArticleService } from '@/features/content/services';
import { useSettingsStore } from '@/stores';
import {
  ArticleExtractionResult,
  MessageAction,
} from '@/types';
import { logger } from '@/utils';

/**
 * Hook for handling Chrome extension messages
 */
export const useChromeMessage = () => {
  /*******************************************************
   * State Management
   *******************************************************/

  const extractionService = useRef(new ArticleService());

  const [tabId, setTabId] = useState<number | null>(null);
  const [tabUrl, setTabUrl] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleExtractionResult | null>(null);
  const [settings, setSettings] = useState(useSettingsStore.getState());

  /*******************************************************
   * Handlers
   *******************************************************/

  /*******************************************************
   * Lifecycle
   *******************************************************/

  useEffect(() => {
    logger.debug('🫳💬', 'useChromeMessage mounted');

    const handleMessage = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      logger.debug('🫳💬', 'useChromeMessage:handleMessage:', message);

      try {
        switch (message.action) {
          case MessageAction.TAB_UPDATED:
            setTabId(message.payload.tabId);
            setTabUrl(message.payload.url);
            if (message.payload.article) {
              setArticle({
                isSuccess: message.payload.article.is_success,
                title: message.payload.article.title ?? null,
                lang: message.payload.article.lang ?? null,
                url: message.payload.article.url,
                content: message.payload.article.content ?? null,
                error: message.payload.article.error ?? null,
              });
            }
            return true;

          case MessageAction.EXTRACT_CONTENT_START:
            try {
              const result: ArticleExtractionResult = await extractionService.current.execute(message.url, message);
              sendResponse(result);
              chrome.runtime.sendMessage({
                action: MessageAction.EXTRACT_CONTENT_COMPLETE,
                result: result,
              });
              setTabId(message.payload.tabId);
              setTabUrl(message.payload.url);
              setArticle(result);
              return true;
            } catch (error: any) {
              logger.error('🫳💬', 'Error in content script:', error);
              sendResponse({ error: error.message });
              setArticle(null);
              return false;
            }

          case MessageAction.COPY_ARTICLE_TO_CLIPBOARD:
            await navigator.clipboard.writeText(message.payload.text);
            return true;

          case MessageAction.SETTINGS_UPDATED:
            setSettings(message.payload);
            return true;

          default:
            logger.debug('🫳💬', 'Unknown message action:', message.action);
            return false;
        }
      } catch (error) {
        logger.error('🫳💬', 'Error handling message:', error);
        return false;
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      logger.debug('🫳💬', 'useChromeMessage unmounted');
    };
  }, []);

  return { article, tabId, tabUrl, settings };
};
