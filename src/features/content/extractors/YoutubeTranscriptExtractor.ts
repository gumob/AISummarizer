import {
  ClientType,
  Innertube,
} from 'youtubei.js/web';

import { ExtractionResult } from '@/types';
import { logger } from '@/utils';

export interface TranscriptSegment {
  text: string;
  startMs: number;
  endMs: number;
}

export class YoutubeTranscriptExtractor {
  // async getTranscript(videoId: string, lang: string = 'en'): Promise<TranscriptSegment[]> {
  //   try {
  //     const yt = await Innertube.create({
  //       client_type: ClientType.WEB,
  //       lang: lang,
  //       fetch: async (input, url) => {
  //         return fetch(input, url);
  //       },
  //     });
  //     const info = await yt.getInfo(videoId, 'WEB');
  //     const scriptInfo = await info.getTranscript();
  //     return (
  //       scriptInfo.transcript?.content?.body?.initial_segments
  //         .filter(segment => segment.snippet.text)
  //         .map(segment => ({
  //           text: segment.snippet.text!,
  //           startMs: Number(segment.start_ms),
  //           endMs: Number(segment.end_ms),
  //         })) || []
  //     );
  //   } catch (error) {
  //     logger.error('Failed to fetch YouTube transcript:', error);
  //     throw error;
  //   }
  // }

  async extract(videoId: string, lang: string = 'en'): Promise<ExtractionResult> {
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
      return {
        title: info.basic_info.title || null,
        content:
          scriptInfo.transcript?.content?.body?.initial_segments
            .filter(segment => segment.snippet.text)
            .map(segment => `[${this.formatTime(Number(segment.start_ms))}] ${segment.snippet.text}`)
            .join('\n') || null,
        isExtracted: true,
      };
    } catch (error) {
      logger.error('Failed to fetch YouTube transcript:', error);
      throw error;
    }
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
