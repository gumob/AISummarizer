import { logger } from '@/utils';

// 動画IDからYouTubeのHTMLを取得
async function getHtmlByVideoID(videoID: string): Promise<string> {
  // YouTubeのURLを生成
  const url = new URL('https://www.youtube.com/watch');
  url.searchParams.set('v', videoID);
  // fetchでHTML取得
  const response = await fetch(url.toString());
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
  playbackTracking?: {
    atrUrl?: {
      baseUrl: string;
    };
  };
}

interface TranscriptSegment {
  utf8: string;
  tOffsetMs?: number;
  acAsrConf?: number;
}

interface TranscriptEvent {
  tStartMs: number;
  dDurationMs: number;
  segs: TranscriptSegment[];
}

interface TranscriptResponse {
  events: TranscriptEvent[];
}

// YouTubeトランスクリプト抽出メイン関数
export async function extractYoutube(videoID: string) {
  logger.debug('Extracting YouTube transcript', videoID);
  let sentences = false; // 文単位フラグ
  let dedupe = false; // 重複除去フラグ

  const clonedDoc = document.cloneNode(true) as Document;
  const html: string = clonedDoc.body.innerHTML;

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

      // 日本語字幕を優先的に取得
      const japaneseTrack = captionTracks.find(track => track.languageCode === 'ja') || captionTracks[0];

      // 字幕URLをJSON3形式に変更
      const captionUrl = new URL(japaneseTrack.baseUrl);
      captionUrl.searchParams.set('fmt', 'json3');
      captionUrl.searchParams.set('potc', '1');
      captionUrl.searchParams.set('xorb', '2');
      captionUrl.searchParams.set('xobt', '3');
      captionUrl.searchParams.set('xovt', '3');
      captionUrl.searchParams.set('cbrand', 'apple');
      captionUrl.searchParams.set('cbr', 'Chrome');
      captionUrl.searchParams.set('cbrver', '137.0.0.0');
      captionUrl.searchParams.set('c', 'WEB');
      captionUrl.searchParams.set('cver', '2.20250530.01.00');

      // 認証トークンを取得
      const atrUrl = json.playbackTracking?.atrUrl?.baseUrl;
      if (atrUrl) {
        const atrUrlObj = new URL(atrUrl);
        const vm = atrUrlObj.searchParams.get('vm');
        if (vm) {
          captionUrl.searchParams.set('pot', vm);
        }
      }

      // 字幕JSON取得
      const response = await fetch(captionUrl.toString(), {
        headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.5',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'x-youtube-client-name': '1',
          'x-youtube-client-version': '2.20250530.01.00',
          'x-youtube-device': 'cbr=Chrome&cbrand=apple&cbrver=137.0.0.0&ceng=WebKit&cengver=537.36&cos=Macintosh&cosver=10_15_7&cplatform=DESKTOP',
          'x-youtube-identity-token': 'QUFFLUhqazRaWjZzY0pyaHhQYUxhOVBiTGhyNWFGUkg4Z3w=',
          'x-youtube-page-cl': '765047946',
          'x-youtube-page-label': 'youtube.desktop.web_20250530_01_RC00',
          'x-youtube-time-zone': 'Asia/Tokyo',
          'x-youtube-utc-offset': '540',
          'x-youtube-ad-signals':
            'dt=1748770378214&flash=0&frm&u_tz=540&u_his=1&u_h=1440&u_w=2560&u_ah=1440&u_aw=2560&u_cd=30&bc=31&bih=1324&biw=378&brdim=3%2C0%2C3%2C0%2C2560%2C0%2C400%2C1325%2C393%2C1324&vis=1&wgl=true&ca_type=image',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        logger.error('Failed to fetch captions JSON', videoID);
        return;
      }

      const responseText = await response.text();
      logger.debug('Raw response:', responseText);

      if (!responseText.trim()) {
        logger.error('Empty response received', videoID);
        return;
      }

      let transcriptData: TranscriptResponse;
      try {
        transcriptData = JSON.parse(responseText);
      } catch (error) {
        logger.error(`Failed to parse JSON response: ${error}`, videoID);
        return;
      }

      // 字幕データの抽出
      const transcript: string[] = [];
      for (const event of transcriptData.events) {
        if (event.segs) {
          const text = event.segs
            .map(seg => seg.utf8)
            .join('')
            .trim();

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
        logger.error(`Error parsing JSON: ${error.message}`, videoID);
      } else {
        logger.error('Unknown error occurred while parsing JSON', videoID);
      }
    }
  } else {
    logger.debug('no captions', videoID);
  }
}
