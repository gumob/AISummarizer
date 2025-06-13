import { ArticleExtractionResult } from '@/types';
import {
  logger,
  waitForElement,
} from '@/utils';

interface TranscriptSegment {
  start: number;
  texts: string[];
}

/**
 * Parse timestamp string to seconds
 * @param timestamp - The timestamp string in format "MM:SS" or "HH:MM:SS"
 * @returns The number of seconds
 */
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Format seconds into time string
 * @param seconds - The number of seconds
 * @returns The formatted time string in format "MM:SS" or "HH:MM:SS"
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    // HH:MM:SS format for times over 1 hour
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    // MM:SS format for times under 1 hour
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Group transcript segments by time intervals
 * @param segments - Array of transcript segments
 * @returns Array of grouped transcript segments
 */
function groupTranscriptSegments(segments: { start: number; text: string }[]): TranscriptSegment[] {
  const groups: TranscriptSegment[] = [];
  let currentGroup: TranscriptSegment | null = null;

  for (const segment of segments) {
    if (!currentGroup || segment.start - currentGroup.start >= 60) {
      currentGroup = { start: segment.start, texts: [] };
      groups.push(currentGroup);
    }
    currentGroup.texts.push(segment.text);
  }

  return groups;
}

/**
 * Extract transcript segments from DOM
 * @param container - The container element containing transcript segments
 * @returns Array of transcript segments
 */
function extractTranscriptSegments(container: Element): { start: number; text: string }[] {
  const segments: { start: number; text: string }[] = [];
  const segmentElements = container.querySelectorAll('ytd-transcript-segment-renderer');

  segmentElements.forEach(element => {
    const timestampElement = element.querySelector('.segment-timestamp');
    const textElement = element.querySelector('.segment-text');

    if (timestampElement && textElement) {
      const timestamp = timestampElement.textContent?.trim() || '';
      const text = textElement.textContent?.trim() || '';

      if (timestamp && text) {
        segments.push({
          start: parseTimestamp(timestamp),
          text,
        });
      }
    }
  });

  return segments;
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

  try {
    /** Wait for 2 seconds */
    await new Promise(resolve => setTimeout(resolve, 3000));

    /** Wait for the transcript button and click it */
    const transcriptButton = await waitForElement('#description-inline-expander ytd-video-description-transcript-section-renderer button');
    if (!(transcriptButton instanceof HTMLElement)) {
      throw new Error('Transcript button not found');
    }
    transcriptButton.click();

    await new Promise(resolve => setTimeout(resolve, 2000));

    /** Wait for the transcript container */
    const transcriptContainer = await waitForElement('#segments-container');
    if (!transcriptContainer) {
      throw new Error('Transcript container not found');
    }

    /** Extract the transcript segments */
    const rawSegments = extractTranscriptSegments(transcriptContainer);
    const segments = groupTranscriptSegments(rawSegments);

    /** Convert segments to string format */
    const content = segments
      .map(segment => {
        const timestamp = formatTime(segment.start);
        const url = `https://youtu.be/${videoId}?t=${Math.floor(segment.start)}s`;
        return `[${timestamp}](${url}) ${segment.texts.join(' ')}`;
      })
      .join('\n');

    /** Wait for the title */
    const titleElement = await waitForElement('#above-the-fold #title');
    const title = titleElement?.textContent?.trim() || null;

    /** Wait for the panel and hide it */
    const panel = await waitForElement('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
    if (panel instanceof HTMLElement) {
      panel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN');
    }

    /** Return the result */
    return {
      isSuccess: true,
      title: title,
      url: rawUrl,
      content,
      error: null,
    };
  } catch (error) {
    logger.error('🎥', '[Youtube.tsx]', '[extractYoutube]', 'Error extracting YouTube transcript', error);
    return {
      isSuccess: false,
      title: null,
      url: rawUrl,
      content: null,
      error: error instanceof Error ? error : new Error('An error occurred'),
    };
  }
}
