import { ReadabilityExtractor } from '@/features/content/extractors/ReadabilityExtractor';
import { YoutubeTranscriptExtractor } from '@/features/content/extractors/YoutubeTranscriptExtractor';
import { logger } from '@/utils';

logger.debug('Content script loaded');

const pageArticleExtractionService = new ReadabilityExtractor();
const youtubeTranscriptService = new YoutubeTranscriptExtractor();

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
          const result = await youtubeTranscriptService.extract(videoId, lang);
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
    const result = pageArticleExtractionService.extract();
    sendResponse(result);
  }
  return true;
});
