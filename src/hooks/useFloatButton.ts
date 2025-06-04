import {
  useEffect,
  useState,
} from 'react';

import { useSettingsStore } from '@/stores';
import { useGlobalContext } from '@/stores/GlobalContext';
import {
  FloatButtonPosition,
  MessageAction,
} from '@/types';
import { logger } from '@/utils';

/**
 * Hook to manage the visibility of the float button
 * @returns The visibility of the float button
 */
export const useFloatButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { floatButtonPosition } = useGlobalContext();

  useEffect(() => {
    logger.debug('🛟', 'mounting');
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      logger.debug('🛟', 'unmounting');
    };
  }, []);

  useEffect(() => {
    const checkVisibility = async () => {
      const floatButtonPosition = await useSettingsStore.getState().getFloatButtonPosition();
      logger.debug('🛟', 'floatButtonPosition', floatButtonPosition);

      if (floatButtonPosition === FloatButtonPosition.HIDE) {
        setIsVisible(false);
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      logger.debug('🛟', 'tab', tab);
      if (!tab.url) {
        setIsVisible(false);
        return;
      }

      // const isExtracted = await isArticleExtractedForUrl(tab.url);
      // setIsVisible(isExtracted);
      setIsVisible(true);
    };

    checkVisibility();
  }, [floatButtonPosition]);

  const handleMessage = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    logger.debug('🛟', 'handleMessage', message.action);

    switch (message.action) {
      case MessageAction.EXTRACT_CONTENT_COMPLETE:
        setIsVisible(true);
        break;
    }
  };

  return {
    isFloatButtonVisible: isVisible,
    setIsFloatButtonVisible: setIsVisible,
  };
};
