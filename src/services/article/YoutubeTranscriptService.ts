import { ClientType, Innertube } from 'youtubei.js/web';

import { logger } from '@/utils';

export interface TranscriptSegment {
  text: string;
  startMs: number;
  endMs: number;
}

export class YoutubeTranscriptService {
  async getTranscript(videoId: string, lang: string = 'en'): Promise<TranscriptSegment[]> {
    try {
      const yt = await Innertube.create({
        client_type: ClientType.WEB,
        lang: lang,
        fetch: async (input, url) => {
          return fetch(input, url);
        },
      });
      const info = await yt.getInfo(videoId, 'WEB');
      const scriptInfo = await info.getTranscript();
      return (
        scriptInfo.transcript?.content?.body?.initial_segments
          .filter(segment => segment.snippet.text)
          .map(segment => ({
            text: segment.snippet.text!,
            startMs: Number(segment.start_ms),
            endMs: Number(segment.end_ms),
          })) || []
      );
    } catch (error) {
      logger.error('Failed to fetch YouTube transcript:', error);
      throw error;
    }
  }
}
