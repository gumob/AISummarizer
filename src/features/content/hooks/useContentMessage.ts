import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { ArticleService } from '@/features/content/services';
import { useSettingsStore } from '@/stores';
import {
  ArticleExtractionResult,
  Message,
  MessageAction,
} from '@/types';
import {
  copyToClipboard,
  logger,
} from '@/utils';

/**
 * Hook for handling Chrome extension messages
 */
export const useContentMessage = () => {
  /*******************************************************
   * State Management
   *******************************************************/

  const extractionService = useRef(new ArticleService());
  const isListenerRegistered = useRef(false);

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
    logger.debug('🫳💬', '[useContentMessage.tsx]', '[useEffect]', 'useContentMessage mounted');

    if (isListenerRegistered.current) {
      logger.warn('🫳💬', '[useContentMessage.tsx]', '[useEffect]', 'useContentMessage: Listener already registered');
      return;
    }

    const handleMessage = async (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): Promise<boolean> => {
      logger.debug('🫳💬', '[useContentMessage.tsx]', '[handleMessage]:', message.action);
      if (!message.payload.tabId) {
        logger.warn('🫳💬', '[useContentMessage.tsx]', '[handleMessage]', 'Ignoring message: tabId is', message.payload.tabId);
        return false;
      }
      if (!message.payload.url) {
        logger.warn('🫳💬', '[useContentMessage.tsx]', '[handleMessage]', 'Ignoring message: url is', message.payload.url);
        return false;
      }

      switch (message.action) {
        case MessageAction.TAB_UPDATED:
          try {
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
          } catch (error) {
            logger.error('🫳💬', '[useContentMessage.tsx]', '[handleMessage]', 'Failed to update tab:', error);
            return false;
          }

        case MessageAction.EXTRACT_ARTICLE_START:
          try {
            const result: ArticleExtractionResult = await extractionService.current.execute(message.payload.url);
            sendResponse(result);
            chrome.runtime.sendMessage({
              action: MessageAction.EXTRACT_ARTICLE_COMPLETE,
              payload: { tabId: message.payload.tabId, url: message.payload.url, result: result },
            });
            setTabId(message.payload.tabId);
            setTabUrl(message.payload.url);
            setArticle(result);
            return true;
          } catch (error: any) {
            logger.error('🫳💬', '[useContentMessage.tsx]', '[handleMessage]', 'Failed to extract article:', error);
            sendResponse({ error: error.message });
            setArticle(null);
            return false;
          }

        case MessageAction.WRITE_ARTICLE_TO_CLIPBOARD:
          try {
            const text = message.payload.text;
            logger.debug('🫳💬', '[useContentMessage.tsx]', '[handleMessage]', 'text', text);
            if (!text) {
              logger.warn('🫳💬', '[useContentMessage.tsx]', '[handleMessage]', 'Ignoring message: text is', text);
              return false;
            }
            await copyToClipboard(text);
            // await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
            return true;
          } catch (error: any) {
            logger.error('🫳💬', '[useContentMessage.tsx]', '[handleMessage]', 'Failed to write article to clipboard:', error);
            return false;
          }

        case MessageAction.SETTINGS_UPDATED:
          setSettings(message.payload);
          return true;

        default:
          logger.debug('🫳💬', '[useContentMessage.tsx]', '[handleMessage]', 'Unknown message action:', message.action);
          return true;
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    isListenerRegistered.current = true;

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      isListenerRegistered.current = false;
      logger.debug('🫳💬', '[useContentMessage.tsx]', '[useEffect]', 'useContentMessage unmounted');
    };
  }, []);

  return { article, tabId, tabUrl, settings };
};
