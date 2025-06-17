import { ArticleExtractionResult } from '@/types';
import { logger, normalizeContent } from '@/utils';

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
 * @param videoId - The ID of the YouTube video.
 * @returns The HTML of the YouTube video.
 */
async function getHtmlByVideoID(videoId: string): Promise<string> {
  /** Generate the URL of the YouTube video. */
  const url = new URL('https://www.youtube.com/watch');
  url.searchParams.set('v', videoId);

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
 * Group transcript segments by time intervals
 * @param elements - The text elements from XML
 * @param videoId - The YouTube video ID
 * @returns Array of grouped transcript segments
 */
function groupTranscriptSegments(elements: HTMLCollectionOf<Element>, videoId: string): string[] {
  const groups: { start: number; texts: string[] }[] = [];
  let currentGroup: { start: number; texts: string[] } | null = null;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const text = element.textContent?.trim();
    const start = parseFloat(element.getAttribute('start') || '0');

    if (!text) continue;

    /**
     * Start a new group if:
     * 1. No current group exists
     * 2. Current segment is more than 60 seconds after the group start
     */
    if (!currentGroup || start - currentGroup.start >= 60) {
      currentGroup = { start, texts: [] };
      groups.push(currentGroup);
    }

    currentGroup.texts.push(text);
  }

  /** Format each group into a single line */
  return groups.map(group => {
    const timestamp = formatTime(group.start);
    const url = `https://www.youtu.be/${videoId}?t=${Math.floor(group.start)}s`;
    return `- [${timestamp}](${url}) ${group.texts.join(' ')}`;
  });
}

/**
 * This function is used to extract the YouTube transcript.
 * @param videoId - The ID of the YouTube video.
 * @returns The transcript of the YouTube video.
 */
export async function extractYoutube(urls: string): Promise<ArticleExtractionResult> {
  /** Extract youtube video id from url */
  const urlMatch = urls.match(/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/);
  const videoId = urlMatch ? urlMatch[1] : null;
  const rawUrl = urls;
  if (!videoId) {
    throw new Error('Could not extract video ID from URL');
  }
  logger.debug('🎥', '[Youtube.tsx]', '[extractYoutube]', 'Extracting YouTube transcript', videoId);

  /** Get the HTML of the YouTube video. */
  const html = await getHtmlByVideoID(videoId);

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
        logger.error('🎥', '[Youtube.tsx]', '[extractYoutube]', 'no captions', videoId);
        return {
          title: videoTitle,
          url: rawUrl,
          content: null,
          isSuccess: false,
        };
      }

      /** Select the caption track based on the language priority. */
      const selectedTrack = selectCaptionTrack(captionTracks, defaultAudioTrackIndex);
      if (!selectedTrack) {
        logger.error('🎥', '[Youtube.tsx]', '[extractYoutube]', 'no suitable caption track found', videoId);
        return {
          title: videoTitle,
          url: rawUrl,
          content: null,
          isSuccess: false,
        };
      }

      /** Generate the caption URL (XML format). */
      const captionUrl = selectedTrack.baseUrl;
      logger.debug('🎥', '[Youtube.tsx]', '[extractYoutube]', 'captionUrl', captionUrl);

      /** Fetch the caption XML. */
      const response = await fetch(captionUrl, {
        headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          dnt: '1',
          priority: 'u=1, i',
          referer: `https://www.youtube.com/watch?v=${videoId}`,
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
        logger.error('🎥', '[Youtube.tsx]', '[extractYoutube]', 'Failed to fetch captions XML', videoId);
        return {
          title: videoTitle,
          url: rawUrl,
          content: null,
          isSuccess: false,
        };
      }

      const responseText = await response.text();

      if (!responseText.trim()) {
        logger.error('🎥', '[Youtube.tsx]', '[extractYoutube]', 'Empty response received', videoId);
        return {
          title: videoTitle,
          url: rawUrl,
          content: null,
          isSuccess: false,
        };
      }

      /** Parse the XML. */
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, 'text/xml');
      const textElements = xmlDoc.getElementsByTagName('text');

      /** Extract and group the caption data. */
      const rawTranscript = groupTranscriptSegments(textElements, videoId).join('\n');
      const transcript = normalizeContent(rawTranscript);

      if (!transcript) {
        logger.error('🎥', '[Youtube.tsx]', '[extractYoutube]', 'Empty transcript', videoId);
        return {
          title: videoTitle,
          url: rawUrl,
          content: null,
          isSuccess: false,
          error: new Error('Empty transcript'),
        };
      }

      return {
        title: videoTitle,
        url: rawUrl,
        content: transcript,
        isSuccess: true,
      };
    } catch (error: unknown) {
      return {
        title: null,
        url: rawUrl,
        content: null,
        isSuccess: false,
        error: error instanceof Error ? error : new Error('Failed to extract YouTube transcript'),
      };
    }
  } else {
    logger.debug('🎥', '[Youtube.tsx]', '[extractYoutube]', 'no captions', videoId);
    return {
      title: null,
      url: rawUrl,
      content: null,
      isSuccess: false,
    };
  }
}
