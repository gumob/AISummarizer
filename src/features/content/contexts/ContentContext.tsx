import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useContentMessage } from '@/features/content/hooks';
import { SettingsState } from '@/stores';
import { ArticleExtractionResult, FloatPanelPosition } from '@/types';
import { isExtractionDenylistUrl, logger } from '@/utils';

/**
 * The context value type for ContentContext.
 *
 * @property tabId - The tab id.
 * @property tabUrl - The tab url.
 * @property article - The article data.
 * @property shouldShowFloatUI - The is float button visible.
 * @property settings - The settings data.
 */
interface ContentContextValue {
  currentTabId: number | null;
  currentTabUrl: string | null;
  currentArticle: ArticleExtractionResult | null;
  shouldShowFloatUI: boolean;
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

  const { currentTabId, currentTabUrl, currentArticle, settings } = useContentMessage();
  const [shouldShowFloatUI, setShouldShowFloatUI] = useState(false);

  /*******************************************************
   * Lifecycle
   *******************************************************/

  useEffect(() => {
    const toggleFloatPanelVisibility = async () => {
      if (!currentTabUrl) {
        setShouldShowFloatUI(false);
        return;
      }
      const isDenied = await isExtractionDenylistUrl(currentTabUrl);
      logger.debug('🗣️🎁', '[ContentContext.tsx]', '[toggleFloatPanelVisibility]', 'isDenied', isDenied);
      if (isDenied) {
        setShouldShowFloatUI(false);
        return;
      }
      const isArticleExtracted = currentArticle != null && currentArticle.isSuccess;
      const state = isArticleExtracted && settings.floatPanelPosition !== FloatPanelPosition.HIDE;
      logger.debug('🗣️🎁', '[ContentContext.tsx]', '[toggleFloatPanelVisibility]', 'state', state);
      setShouldShowFloatUI(state);
    };
    toggleFloatPanelVisibility();
  }, [currentTabId, currentTabUrl, currentArticle, settings]);

  /*******************************************************
   * Exported Value
   *******************************************************/

  const value = useMemo(
    () => ({
      currentTabId,
      currentTabUrl,
      currentArticle,
      shouldShowFloatUI,
      settings,
    }),
    [currentTabId, currentTabUrl, currentArticle, shouldShowFloatUI, settings]
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
