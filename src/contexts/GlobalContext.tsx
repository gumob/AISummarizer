import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ArticleModel } from '@/models';
import { logger } from '@/utils';

/**
 * The context value type for GlobalContext.
 *
 * @property isArticleExtracted - The is article extracted.
 * @property setIsArticleExtracted - The set is article extracted function.
 * @property article - The article data.
 * @property setArticle - The set article data function.
 * @property isLoading - The is loading.
 */
interface GlobalContextValue {
  isArticleExtracted: boolean;
  setIsArticleExtracted: (isArticleExtracted: boolean) => void;
  article: ArticleModel | null;
  setArticle: (article: ArticleModel | null) => void;
  isLoading: boolean;
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
   * Memoized Values
   *******************************************************/

  /*******************************************************
   * Core Function
   *******************************************************/

  /*******************************************************
   * Event Handlers
   *******************************************************/

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
    }),
    [isArticleExtracted, setIsArticleExtracted, article, setArticle, isLoading]
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
