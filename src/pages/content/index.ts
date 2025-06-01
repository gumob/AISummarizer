import {
  ClientType,
  Innertube,
} from 'youtubei.js/web';

import { Readability } from '@mozilla/readability';

export async function getTranscript(videoId: string, lang: string = 'en') {
  const yt = await Innertube.create({
    client_type: ClientType.WEB,
    lang: lang,
    fetch: async (input, url) => {
      return fetch(input, url);
    },
  });
  let info = await yt.getInfo(videoId, 'WEB');
  let scriptInfo = await info.getTranscript();
  return (
    scriptInfo.transcript?.content?.body?.initial_segments.map(segment => ({
      text: segment.snippet.text,
      startMs: segment.start_ms,
      endMs: segment.end_ms,
    })) || []
  );
}

// Original message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === 'EXTRACT_CONTENT') {
    const url = window.location.href;

    // YouTubeの場合
    if (url.includes('youtube.com/watch')) {
      (async () => {
        try {
          const { videoId, lang } = request;
          const result = await getTranscript(videoId, lang);
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

    // 通常のWebページの場合
    try {
      const documentClone = document.cloneNode(true) as Document;
      const reader = new Readability(documentClone);
      const article = reader.parse();

      sendResponse({
        title: article?.title || null,
        content: article?.content || null,
        isExtracted: !!article,
      });
    } catch (error) {
      console.error('Failed to extract content:', error);
      sendResponse({
        title: null,
        content: null,
        isExtracted: false,
      });
    }
  }

  // Use an async IIFE to handle the async operation
  return true; // Keep message port open
});
