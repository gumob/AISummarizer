import React, {
  createContext,
  useContext,
  useMemo,
} from 'react';

import { useFloatButton } from '@/hooks';
import { useSettingsStore } from '@/stores';
import {
  AIService,
  ContentExtractionTiming,
  FloatButtonPosition,
  TabBehavior,
} from '@/types';

/**
 * The context value type for ContentContext.
 *
 * @property isArticleExtracted - The is article extracted.
 * @property setIsArticleExtracted - The set is article extracted function.
 * @property article - The article data.
 * @property setArticle - The set article data function.
 * @property isLoading - The is loading.
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
  isFloatButtonVisible: boolean;
  setIsFloatButtonVisible: (isFloatButtonVisible: boolean) => void;
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

  const { isFloatButtonVisible, setIsFloatButtonVisible } = useFloatButton();
  const settings = useSettingsStore();

  /*******************************************************
   * Lifecycle
   *******************************************************/

  /*******************************************************
   * Exported Value
   *******************************************************/

  const value = useMemo(
    () => ({
      isFloatButtonVisible,
      setIsFloatButtonVisible,
      ...settings,
    }),
    [isFloatButtonVisible, setIsFloatButtonVisible, settings]
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
