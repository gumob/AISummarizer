import { logger } from '@/utils';

// 動画IDからYouTubeのHTMLを取得
async function getHtmlByVideoID(videoID: string): Promise<string> {
  // YouTubeのURLを生成
  const url = new URL('https://www.youtube.com/watch');
  url.searchParams.set('v', videoID);

  // fetchでHTML取得
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

// 先頭文字を大文字にする
function capitalizeFirstLetter<T extends string>([first = '', ...rest]: T): string {
  return [first.toUpperCase(), ...rest].join('');
}

// 句読点リスト
const puncs = [',', '.', '?', '!', ';', ':'];

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  name: {
    simpleText: string;
  };
}

interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
}

interface TranscriptSegment {
  text: string;
  start: number;
  dur: number;
}

// YouTubeトランスクリプト抽出メイン関数
export async function extractYoutube(videoID: string) {
  logger.debug('Extracting YouTube transcript', videoID);
  let sentences = false; // 文単位フラグ
  let dedupe = false; // 重複除去フラグ

  const html = await getHtmlByVideoID(videoID);

  // ytInitialPlayerResponseのJSON部分を抽出
  const ytInitialPlayerResponsePattern = /var\s+ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/;
  const match = html.match(ytInitialPlayerResponsePattern);

  if (match && match[1]) {
    try {
      const json = JSON.parse(match[1]) as PlayerResponse;
      logger.debug('json', json);

      const captionTracks = json.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!captionTracks || captionTracks.length === 0) {
        logger.error('no captions', videoID);
        return;
      }
      logger.debug('captionTracks', captionTracks);

      // 日本語字幕を優先的に取得
      const japaneseTrack = captionTracks.find(track => track.languageCode === 'ja') || captionTracks[0];

      // 字幕URLを生成（XML形式）- baseUrlをそのまま使用
      const captionUrl = japaneseTrack.baseUrl;
      logger.debug('captionUrl', captionUrl);

      // 字幕XML取得
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
        return;
      }

      logger.debug('response:', response);
      const responseText = await response.text();
      logger.debug('Raw response:', responseText);

      if (!responseText.trim()) {
        logger.error('Empty response received', videoID);
        return;
      }

      // XMLをパース
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, 'text/xml');
      const textElements = xmlDoc.getElementsByTagName('text');

      // 字幕データの抽出
      const transcript: string[] = [];
      for (let i = 0; i < textElements.length; i++) {
        const text = textElements[i].textContent?.trim();
        if (text) {
          // 文単位処理
          if (sentences) {
            const chars = [...text];
            if (chars.length > 0) {
              const firstUpper = chars[0].toUpperCase();
              let theRest = chars.slice(1);

              if (theRest.length > 0) {
                let lastChar = theRest.pop()!;
                if (!puncs.includes(lastChar)) {
                  lastChar += '.';
                }
                theRest.push(lastChar);
              }
              transcript.push([firstUpper, ...theRest].join(''));
            }
          } else {
            transcript.push(text);
          }
        }
      }

      // 重複除去
      if (dedupe) {
        const uniqueTranscript = transcript.filter((line, index, self) => self.indexOf(line) === index);
        logger.debug('unique transcript', uniqueTranscript);
      } else {
        logger.debug('transcript', transcript);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Error parsing XML: ${error.message}`, videoID);
      } else {
        logger.error('Unknown error occurred while parsing XML', videoID);
      }
    }
  } else {
    logger.debug('no captions', videoID);
  }
}
