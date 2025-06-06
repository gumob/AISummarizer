import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { toast } from '@/features/content/components/main/Toaster';
import { useChromeMessage } from '@/features/content/hooks';
import { SettingsState } from '@/stores';
import { ArticleExtractionResult, FloatPanelPosition } from '@/types';
import { logger } from '@/utils';

/**
 * The context value type for ContentContext.
 *
 * @property tabId - The tab id.
 * @property tabUrl - The tab url.
 * @property article - The article data.
 * @property isFloatPanelVisible - The is float button visible.
 * @property settings - The settings data.
 */
interface ContentContextValue {
  tabId: number | null;
  tabUrl: string | null;
  article: ArticleExtractionResult | null;
  isFloatPanelVisible: boolean;
  settings: SettingsState;
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

  const { tabId, tabUrl, article, settings } = useChromeMessage();
  const [isFloatPanelVisible, setIsFloatPanelVisible] = useState(false);

  /*******************************************************
   * Lifecycle
   *******************************************************/

  useEffect(() => {
    const checkVisibility = async () => {
      const isArticleExtracted = article != null && article.isSuccess;
      const state = isArticleExtracted && settings.floatButtonPosition !== FloatPanelPosition.HIDE;
      logger.debug('🗣️🎁', 'checkVisibility', 'state', state);
      setIsFloatPanelVisible(state);
    };
    checkVisibility();
  }, [tabId, tabUrl, article, settings]);

  useEffect(() => {
    if (article?.isSuccess) {
      logger.debug('🗣️🎁', 'Article extracted successfully');
      toast.success('Article extracted successfully');
    }
  }, [article]);

  /*******************************************************
   * Exported Value
   *******************************************************/

  const value = useMemo(
    () => ({
      tabId,
      tabUrl,
      article,
      isFloatPanelVisible,
      settings,
    }),
    [tabId, tabUrl, article, isFloatPanelVisible, settings]
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
