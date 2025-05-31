import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ArticleModel } from '@/models';
import { useSettingsStore } from '@/stores/SettingsStore';
import {
  AIService,
  FloatButtonPosition,
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
 * @property isLoading - The is loading.
 * @property prompts - The prompts data.
 * @property prompt - The get prompt function.
 * @property tabBehavior - The tab behavior.
 * @property floatButtonPosition - The float button position.
 * @property setPrompt - The set prompt function.
 * @property setTabBehavior - The set tab behavior function.
 * @property setFloatButtonPosition - The set float button position function.
 */
interface GlobalContextValue {
  isArticleExtracted: boolean;
  setIsArticleExtracted: (isArticleExtracted: boolean) => void;
  article: ArticleModel | null;
  setArticle: (article: ArticleModel | null) => void;
  isLoading: boolean;
  prompts: {
    [key in AIService]: string;
  };
  prompt: (service: AIService) => string;
  setPrompt: (service: AIService, prompt: string) => void;
  tabBehavior: TabBehavior;
  setTabBehavior: (tabBehavior: TabBehavior) => void;
  floatButtonPosition: FloatButtonPosition;
  setFloatButtonPosition: (floatButtonPosition: FloatButtonPosition) => void;
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

  /**
   * The is loading.
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Refs for managing component lifecycle and preventing stale closures
   */
  const isInitialized = useRef(false);
  const isSubscribed = useRef(false);

  /*******************************************************
   * Core Function
   *******************************************************/

  const { prompts, prompt, tabBehavior, floatButtonPosition, setPrompt, setTabBehavior, setFloatButtonPosition } = useSettingsStore();

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
      logger.debug('Initializing GlobalContextProvider');
      try {
        /* Initialize stores in sequence */
        isInitialized.current = true;
      } catch (error) {
        logger.error('Failed to initialize extensions', error);
      }
    };
    if (!isInitialized.current) initialize();

    /** Subscribe listeners */
    if (!isSubscribed.current) {
      logger.debug('Subscribing listeners');
      isSubscribed.current = true;
    }

    /** Unsubscribe listeners */
    return () => {
      logger.debug('Deinitializing GlobalContextProvider');
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
      isLoading,
      prompts,
      prompt,
      tabBehavior,
      floatButtonPosition,
      setPrompt,
      setTabBehavior,
      setFloatButtonPosition,
    }),
    [
      isArticleExtracted,
      setIsArticleExtracted,
      article,
      setArticle,
      isLoading,
      prompts,
      prompt,
      setPrompt,
      tabBehavior,
      setTabBehavior,
      floatButtonPosition,
      setFloatButtonPosition,
    ]
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
