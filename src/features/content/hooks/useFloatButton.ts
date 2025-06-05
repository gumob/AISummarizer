import { useEffect, useState } from 'react';

import { useSettingsStore } from '@/stores';
import { ArticleExtractionResult, FloatPanelPosition } from '@/types';
import { logger } from '@/utils';

/**
 * Hook to manage the visibility of the float button
 * @param url - The current URL
 * @param article - The extracted article result
 * @returns The visibility of the float button
 */
export const useFloatButton = (url: string | null, article: ArticleExtractionResult | null) => {
  const [isVisible, setIsVisible] = useState(false);
  const { floatButtonPosition } = useSettingsStore();

  useEffect(() => {
    logger.debug('🫳🛟', 'url', url, 'article', article);

    const checkVisibility = async () => {
      if (!url || !article) {
        setIsVisible(false);
        return;
      }

      const isArticleExtracted = article.isSuccess;
      const state = isArticleExtracted && floatButtonPosition !== FloatPanelPosition.HIDE;
      logger.debug('🫳🛟', 'checkVisibility', 'state', state);
      setIsVisible(state);
    };

    checkVisibility();
  }, [url, article, floatButtonPosition]);

  return {
    isFloatPanelVisible: isVisible,
    setIsFloatPanelVisible: setIsVisible,
  };
};
