import { ExtractionResult } from '@/types';
import { logger } from '@/utils';

/** List of punctuation marks. */
const puncs = [',', '.', '?', '!', ';', ':'];

/**
 * Interface for a caption track.
 * @property baseUrl - The base URL of the caption track.
 * @property languageCode - The code of the language of the caption track.
 * @property name - The name of the caption track.
 */
interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  name: {
    simpleText: string;
  };
}

/**
 * Interface for the player response.
 * @property captions - The captions of the player.
 * @property playerCaptionsTracklistRenderer - The player captions tracklist renderer.
 * @property videoDetails - The video details of the player.
 */
interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
      defaultAudioTrackIndex?: number;
    };
  };
  videoDetails?: {
    title?: string;
  };
}

/**
 * This function is used to get the HTML of a YouTube video by its ID.
 * @param videoID - The ID of the YouTube video.
 * @returns The HTML of the YouTube video.
 */
async function getHtmlByVideoID(videoID: string): Promise<string> {
  /** Generate the URL of the YouTube video. */
  const url = new URL('https://www.youtube.com/watch');
  url.searchParams.set('v', videoID);

  /** Fetch the HTML of the YouTube video. */
  const response = await fetch(url.toString(), {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': navigator.userAgent,
    },
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube page: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

/**
 * This function is used to select the caption track based on the language priority.
 * @param captionTracks - The caption tracks.
 * @param defaultAudioTrackIndex - The index of the default audio track.
 * @returns The selected caption track.
 */
function selectCaptionTrack(captionTracks: CaptionTrack[], defaultAudioTrackIndex?: number): CaptionTrack | undefined {
  if (!captionTracks || captionTracks.length === 0) {
    return undefined;
  }

  /** 1. The original language of the video (specified by defaultAudioTrackIndex). */
  if (defaultAudioTrackIndex !== undefined && captionTracks[defaultAudioTrackIndex]) {
    return captionTracks[defaultAudioTrackIndex];
  }

  /** 2. The browser's setting language. */
  const browserLanguage = navigator.language.split('-')[0]; // 'ja-JP' -> 'ja'
  const browserLanguageTrack = captionTracks.find(track => track.languageCode === browserLanguage);
  if (browserLanguageTrack) {
    return browserLanguageTrack;
  }

  /** 3. The first available caption track. */
  return captionTracks[0];
}

/**
 * Format seconds into MM:SS format
 * @param seconds - The number of seconds
 * @returns The formatted time string
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * This function is used to extract the YouTube transcript.
 * @param videoID - The ID of the YouTube video.
 * @returns The transcript of the YouTube video.
 */
export async function extractYoutube(videoID: string): Promise<ExtractionResult> {
  logger.debug('Extracting YouTube transcript', videoID);

  /** Get the HTML of the YouTube video. */
  const html = await getHtmlByVideoID(videoID);

  /** Extract the JSON part of ytInitialPlayerResponse. */
  const ytInitialPlayerResponsePattern = /var\s+ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/;
  const match = html.match(ytInitialPlayerResponsePattern);

  if (match && match[1]) {
    try {
      const json = JSON.parse(match[1]) as PlayerResponse;
      const videoTitle = json.videoDetails?.title || null;

      /** Get the caption tracks. */
      const captionTracks = json.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      const defaultAudioTrackIndex = json.captions?.playerCaptionsTracklistRenderer?.defaultAudioTrackIndex;

      if (!captionTracks || captionTracks.length === 0) {
        logger.error('no captions', videoID);
        return {
          title: videoTitle,
          lang: null,
          textContent: null,
          isExtracted: false,
        };
      }

      /** Select the caption track based on the language priority. */
      const selectedTrack = selectCaptionTrack(captionTracks, defaultAudioTrackIndex);
      if (!selectedTrack) {
        logger.error('no suitable caption track found', videoID);
        return {
          title: videoTitle,
          lang: null,
          textContent: null,
          isExtracted: false,
        };
      }

      /** Generate the caption URL (XML format). */
      const captionUrl = selectedTrack.baseUrl;

      /** Fetch the caption XML. */
      const response = await fetch(captionUrl, {
        headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          dnt: '1',
          priority: 'u=1, i',
          referer: `https://www.youtube.com/watch?v=${videoID}`,
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'sec-gpc': '1',
          'upgrade-insecure-requests': '1',
          'user-agent': navigator.userAgent,
        },
        credentials: 'omit',
      });

      if (!response.ok) {
        logger.error('Failed to fetch captions XML', videoID);
        return {
          title: videoTitle,
          lang: selectedTrack.languageCode,
          textContent: null,
          isExtracted: false,
        };
      }

      const responseText = await response.text();

      if (!responseText.trim()) {
        logger.error('Empty response received', videoID);
        return {
          title: videoTitle,
          lang: selectedTrack.languageCode,
          textContent: null,
          isExtracted: false,
        };
      }

      /** Parse the XML. */
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, 'text/xml');
      const textElements = xmlDoc.getElementsByTagName('text');

      /** Extract the caption data. */
      const transcript: string[] = [];
      for (let i = 0; i < textElements.length; i++) {
        const element = textElements[i];
        const text = element.textContent?.trim();
        const start = parseFloat(element.getAttribute('start') || '0');

        if (text) {
          const timestamp = formatTime(start);
          const url = `https://www.youtube.com/watch?v=${videoID}&t=${Math.floor(start)}s`;
          transcript.push(`- [${timestamp}](${url}) ${text}`);
        }
      }

      return {
        title: videoTitle,
        lang: selectedTrack.languageCode,
        textContent: transcript.join('\n'),
        isExtracted: true,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Error parsing XML: ${error.message}`, videoID);
      } else {
        logger.error('Unknown error occurred while parsing XML', videoID);
      }
      return {
        title: null,
        lang: null,
        textContent: null,
        isExtracted: false,
      };
    }
  } else {
    logger.debug('no captions', videoID);
    return {
      title: null,
      lang: null,
      textContent: null,
      isExtracted: false,
    };
  }
}
