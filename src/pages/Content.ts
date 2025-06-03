import { ArticleService } from '@/features/content/services';
import { logger } from '@/utils';

logger.debug('Content script loaded');

const extractionService = new ArticleService();

const handleMessage = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  logger.debug('Received message:', message);

  switch (message.action) {
    case 'EXTRACT_CONTENT':
      try {
        const result = await extractionService.execute(message.url, message);
        sendResponse(result);
        return true;
      } catch (error: any) {
        logger.error('Error in content script:', error);
        sendResponse({ error: error.message });
        return false;
      }
    default:
      return false;
  }
};

chrome.runtime.onMessage.removeListener(handleMessage);
chrome.runtime.onMessage.addListener(handleMessage);
