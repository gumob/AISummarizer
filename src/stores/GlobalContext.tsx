import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { db } from '@/db';
import { ArticleModel } from '@/models';
import { useSettingsStore } from '@/stores';
import {
  AIService,
  ContentExtractionTiming,
  FloatPanelPosition,
  TabBehavior,
} from '@/types';
import { logger } from '@/utils';

/**
 * The context value type for GlobalContext.
 *
 * @property isArticleExtracted - The is article extracted.
 * @property setIsArticleExtracted - The set is article extracted function.
 * @property article - The article data.
 * @property setArticle - The set article data function.
 * @property prompts - The prompts data.
 * @property prompt - The get prompt function.
 * @property tabBehavior - The tab behavior.
 * @property floatButtonPosition - The float button position.
 * @property contentExtractionTiming - The page extraction method.
 * @property setContentExtractionTiming - The set page extraction method function.
 * @property extractionDenylist - The extraction denylist.
 * @property setExtractionDenylist - The set extraction denylist function.
 * @property setPrompt - The set prompt function.
 * @property setTabBehavior - The set tab behavior function.
 * @property setFloatButtonPosition - The set float button position function.
 * @property isShowMessage - The is show message.
 * @property setIsShowMessage - The set is show message function.
 * @property isShowBadge - The is show badge.
 * @property setIsShowBadge - The set is show badge function.
 * @property saveArticleOnClipboard - The save article on clipboard.
 * @property setSaveArticleOnClipboard - The set save article on clipboard function.
 * @property restoreSettings - The reset settings function.
 * @property resetDatabase - The reset database function.
 * @property exportSettings - The export settings function.
 * @property importSettings - The import settings function.
 */
interface GlobalContextValue {
  isArticleExtracted: boolean;
  setIsArticleExtracted: (isArticleExtracted: boolean) => void;
  article: ArticleModel | null;
  setArticle: (article: ArticleModel | null) => void;
  prompts: {
    [key in AIService]: string;
  };
  prompt: (service: AIService) => Promise<string>;
  setPrompt: (service: AIService, prompt: string) => Promise<void>;
  tabBehavior: TabBehavior;
  setTabBehavior: (tabBehavior: TabBehavior) => Promise<void>;
  floatButtonPosition: FloatPanelPosition;
  setFloatButtonPosition: (floatButtonPosition: FloatPanelPosition) => Promise<void>;
  contentExtractionTiming: ContentExtractionTiming;
  setContentExtractionTiming: (contentExtractionTiming: ContentExtractionTiming) => Promise<void>;
  extractionDenylist: string[];
  setExtractionDenylist: (extractionDenylist: string[]) => Promise<void>;
  isShowMessage: boolean;
  setIsShowMessage: (isShowMessage: boolean) => Promise<void>;
  isShowBadge: boolean;
  setIsShowBadge: (isShowBadge: boolean) => Promise<void>;
  saveArticleOnClipboard: boolean;
  setSaveArticleOnClipboard: (saveArticleOnClipboard: boolean) => Promise<void>;
  exportSettings: () => Promise<{ success: boolean; error?: Error }>;
  importSettings: (file: File) => Promise<{ success: boolean; error?: Error }>;
  restoreSettings: () => Promise<{ success: boolean; error?: Error }>;
  resetDatabase: () => Promise<{ success: boolean; error?: Error }>;
}

/**
 * The GlobalContext.
 */
const GlobalContext = createContext<GlobalContextValue | null>(null);

/**
 * The props for the GlobalContextProvider component.
 */
interface GlobalContextProviderProps {
  /**
   * The children to render.
   */
  children: React.ReactNode;
}

/**
 * The GlobalContextProvider component.
 *
 * @param children - The children to render.
 * @returns The GlobalContextProvider component.
 */
export const GlobalContextProvider: React.FC<GlobalContextProviderProps> = ({ children }) => {
  /*******************************************************
   * State Management
   *******************************************************/

  const [isArticleExtracted, setIsArticleExtracted] = useState(false);
  const [article, setArticle] = useState<ArticleModel | null>(null);
  const settings = useSettingsStore();

  /**
   * Refs for managing component lifecycle and preventing stale closures
   */
  const isInitialized = useRef(false);
  const isSubscribed = useRef(false);

  /*******************************************************
   * Core Function
   *******************************************************/

  const resetDatabase = async (): Promise<{ success: boolean; error?: Error }> => {
    return await db.clearArticles();
  };

  /*******************************************************
   * Lifecycle
   *******************************************************/

  /**
   * Main effect for initializing extension management and setting up event listeners.
   * Implements a more robust cleanup mechanism.
   */
  useEffect(() => {
    /** Initialize extensions */
    const initialize = async () => {
      logger.debug('🗣️🌏', '[GlobalContextProvider.tsx]', '[useEffect]', 'Initializing GlobalContextProvider');
      try {
        /* Initialize stores in sequence */
        isInitialized.current = true;
      } catch (error) {
        logger.error('🗣️🌏', '[GlobalContextProvider.tsx]', '[useEffect]', 'Failed to initialize extensions', error);
      }
    };
    if (!isInitialized.current) initialize();

    /** Subscribe listeners */
    if (!isSubscribed.current) {
      logger.debug('🗣️🌏', '[GlobalContextProvider.tsx]', '[useEffect]', 'Subscribing listeners');
      isSubscribed.current = true;
    }

    /** Unsubscribe listeners */
    return () => {
      logger.debug('🗣️🌏', '[GlobalContextProvider.tsx]', '[useEffect]', 'Deinitializing GlobalContextProvider');
      isSubscribed.current = false;
    };
  }, []);

  /*******************************************************
   * Exported Value
   *******************************************************/

  const value = useMemo(
    () => ({
      isArticleExtracted,
      setIsArticleExtracted,
      article,
      setArticle,
      resetDatabase,
      ...settings,
    }),
    [isArticleExtracted, setIsArticleExtracted, article, setArticle, settings]
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

/**
 * The useGlobalContext hook.
 *
 * @returns The GlobalContext value.
 * @throws Error if used outside of GlobalContextProvider.
 */
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within an GlobalContextProvider');
  }
  return context;
};
