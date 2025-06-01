import { ArticleExtractionService } from '@/features/content/service/ArticleExtractionService';
import { logger } from '@/utils';

logger.debug('Content script loaded');

const extractionService = new ArticleExtractionService();

const handleMessage = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  logger.debug('Received message:', message);

  if (message.action === 'EXTRACT_CONTENT') {
    try {
      const result = await extractionService.execute(message.url, message);
      sendResponse(result);
      return true;
    } catch (error: any) {
      logger.error('Error in content script:', error);
      sendResponse({ error: error.message });
      return false;
    }
  }

  return false;
};

chrome.runtime.onMessage.removeListener(handleMessage);
chrome.runtime.onMessage.addListener(handleMessage);
