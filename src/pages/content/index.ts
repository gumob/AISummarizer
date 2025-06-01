import { PageArticleExtractionService } from '@/services/article/PageArticleExtractionService';
import { YoutubeTranscriptService } from '@/services/article/YoutubeTranscriptService';
import { logger } from '@/utils';

const pageArticleExtractionService = new PageArticleExtractionService();
const youtubeTranscriptService = new YoutubeTranscriptService();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.debug('Received message:', request);
  if (request.action === 'EXTRACT_CONTENT') {
    const url = window.location.href;

    /**
     * Skip processing for browser-specific URLs
     */
    if (/^(chrome|brave|edge|opera|vivaldi):\/\//.test(url)) {
      return true;
    }

    /**
     * YouTube
     */
    if (/^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/.test(url)) {
      (async () => {
        try {
          const { videoId, lang } = request;
          const result = await youtubeTranscriptService.getTranscript(videoId, lang);
          sendResponse({
            action: 'TRANSCRIPT_RESULT',
            transcript: result,
            requestId: request.requestId,
          });
        } catch (error: any) {
          sendResponse({
            action: 'TRANSCRIPT_ERROR',
            error: error.message,
            requestId: request.requestId,
          });
        }
      })();
      return true;
    }

    /**
     * Normal web page
     */
    const result = pageArticleExtractionService.extractArticle();
    sendResponse(result);
  }
  return true;
});
