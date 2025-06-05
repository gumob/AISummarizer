import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useChromeMessage } from '@/features/content/hooks';
import { useSettingsStore } from '@/stores';
import { AIService, ArticleExtractionResult, ContentExtractionTiming, FloatButtonPosition, TabBehavior } from '@/types';
import { logger } from '@/utils';

/**
 * The context value type for ContentContext.
 *
 * @property tabId - The tab id.
 * @property tabUrl - The tab url.
 * @property article - The article data.
 * @property isFloatButtonVisible - The is float button visible.
 * @property setIsFloatButtonVisible - The set is float button visible function.
 * @property prompts - The prompts data.
 * @property prompt - The get prompt function.
 * @property tabBehavior - The tab behavior.
 * @property floatButtonPosition - The float button position.
 * @property contentExtractionTiming - The page extraction method.
 * @property setContentExtractionTiming - The set page extraction method function.
 * @property setPrompt - The set prompt function.
 * @property setTabBehavior - The set tab behavior function.
 * @property setFloatButtonPosition - The set float button position function.
 * @property isShowMessage - The is show message.
 * @property setIsShowMessage - The set is show message function.
 * @property isShowBadge - The is show badge.
 * @property setIsShowBadge - The set is show badge function.
 * @property saveArticleOnClipboard - The save article on clipboard.
 * @property setSaveArticleOnClipboard - The set save article on clipboard function.
 */
interface ContentContextValue {
  tabId: number | null;
  tabUrl: string | null;
  article: ArticleExtractionResult | null;
  isFloatButtonVisible: boolean;
  prompts: {
    [key in AIService]: string;
  };
  prompt: (service: AIService) => Promise<string>;
  setPrompt: (service: AIService, prompt: string) => Promise<void>;
  tabBehavior: TabBehavior;
  setTabBehavior: (tabBehavior: TabBehavior) => Promise<void>;
  floatButtonPosition: FloatButtonPosition;
  setFloatButtonPosition: (floatButtonPosition: FloatButtonPosition) => Promise<void>;
  contentExtractionTiming: ContentExtractionTiming;
  setContentExtractionTiming: (contentExtractionTiming: ContentExtractionTiming) => Promise<void>;
  isShowMessage: boolean;
  setIsShowMessage: (isShowMessage: boolean) => Promise<void>;
  isShowBadge: boolean;
  setIsShowBadge: (isShowBadge: boolean) => Promise<void>;
  saveArticleOnClipboard: boolean;
  setSaveArticleOnClipboard: (saveArticleOnClipboard: boolean) => Promise<void>;
}

/**
 * The ContentContext.
 */
const ContentContext = createContext<ContentContextValue | null>(null);

/**
 * The props for the ContentContextProvider component.
 */
interface ContentContextProviderProps {
  /**
   * The children to render.
   */
  children: React.ReactNode;
}

/**
 * The ContentContextProvider component.
 *
 * @param children - The children to render.
 * @returns The ContentContextProvider component.
 */
export const ContentContextProvider: React.FC<ContentContextProviderProps> = ({ children }) => {
  /*******************************************************
   * State Management
   *******************************************************/

  const { tabId, tabUrl, article } = useChromeMessage();
  const [isFloatButtonVisible, setIsFloatButtonVisible] = useState(false);
  const settings = useSettingsStore();

  /*******************************************************
   * Lifecycle
   *******************************************************/

  useEffect(() => {
    const checkVisibility = async () => {
      logger.debug('🗣️🎁', 'checkVisibility', 'article', article);
      const isArticleExtracted = article != null && article.isSuccess;
      const floatButtonPosition = await useSettingsStore.getState().getFloatButtonPosition();
      logger.debug('🗣️🎁', 'checkVisibility', 'isArticleExtracted', isArticleExtracted);
      logger.debug('🗣️🎁', 'checkVisibility', 'floatButtonPosition', floatButtonPosition);
      const state = isArticleExtracted && floatButtonPosition !== FloatButtonPosition.HIDE;
      logger.debug('🗣️🎁', 'checkVisibility', 'state', state);
      setIsFloatButtonVisible(state);
    };
    checkVisibility();
  }, [tabId, tabUrl, article]);

  /*******************************************************
   * Exported Value
   *******************************************************/

  const value = useMemo(
    () => ({
      tabId,
      tabUrl,
      article,
      isFloatButtonVisible,
      ...settings,
    }),
    [tabId, tabUrl, article, isFloatButtonVisible, settings]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};

/**
 * The useContentContext hook.
 *
 * @returns The ContentContext value.
 * @throws Error if used outside of ContentContextProvider.
 */
export const useContentContext = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContentContext must be used within an ContentContextProvider');
  }
  return context;
};
