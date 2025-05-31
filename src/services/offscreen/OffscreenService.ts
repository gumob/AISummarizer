import { chromeAPI } from '@/api';
import { logger } from '@/utils';

export class OffscreenService {
  async createOffscreenDocument() {
    try {
      if (await chromeAPI.hasOffscreenDocument()) {
        await chromeAPI.closeOffscreenDocument();
      }

      await chromeAPI.createOffscreenDocument('offscreen.html', ['MATCH_MEDIA' as chrome.offscreen.Reason], 'Detect system color scheme changes');
      logger.debug('Offscreen document created successfully');
    } catch (error) {
      logger.error('Failed to create offscreen document', error);
      throw error;
    }
  }
}
