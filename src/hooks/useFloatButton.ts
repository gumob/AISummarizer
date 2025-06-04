import {
  useEffect,
  useState,
} from 'react';

import { useArticleStore } from '@/stores';
import { useGlobalContext } from '@/stores/GlobalContext';

export const useFloatButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { floatButtonPosition } = useGlobalContext();
  const { isArticleExtractedForUrl } = useArticleStore();

  useEffect(() => {
    const checkVisibility = async () => {
      if (floatButtonPosition === 'HIDE') {
        setIsVisible(false);
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url) {
        setIsVisible(false);
        return;
      }

      const isExtracted = await isArticleExtractedForUrl(tab.url);
      setIsVisible(isExtracted);
    };

    checkVisibility();
  }, [floatButtonPosition, isArticleExtractedForUrl]);

  return { isVisible };
};
