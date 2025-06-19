import { DataEntry, PdfReader } from 'pdfreader';

import { ArticleExtractionResult } from '@/types';
import { fileNameFromUrl, logger } from '@/utils';

export async function extractPDF(url: string): Promise<ArticleExtractionResult> {
  try {
    logger.debug('📕', '[PDF.tsx]', '[extractPDF]', 'extractPDF url:', url);
    try {
      const result: DataEntry = await new Promise((resolve, reject) => {
        new PdfReader().parseFileItems(url, (err, item) => {
          if (item && item.text) {
            resolve(item);
          } else if (err) {
            reject(err);
          } else {
            reject(new Error('Failed to extract PDF'));
          }
        });
      });
      if (result !== null && result.text) {
        return {
          title: fileNameFromUrl(url),
          url: url,
          content: result as string,
          isSuccess: true,
        };
      } else {
        return {
          title: null,
          url: url,
          content: null,
          isSuccess: false,
          error: new Error('Failed to extract PDF. Could not find text in PDF'),
        };
      }
    } catch (error) {
      return {
        title: null,
        url: url,
        content: null,
        isSuccess: false,
        error: error instanceof Error ? error : new Error('Failed to extract PDF. Unknown error.'),
      };
    }
  } catch (error: unknown) {
    logger.error('📕', '[PDF.tsx]', '[extractPDF]', 'Failed to extract PDF:', error);
    return {
      title: null,
      url: null,
      content: null,
      isSuccess: false,
      error: error instanceof Error ? error : new Error('Failed to extract PDF'),
    };
  }
}
