import { ArticleExtractionResult } from '@/types';
import { fileNameFromUrl, logger } from '@/utils';

export async function extractPDF(url: string): Promise<ArticleExtractionResult> {
  try {
    logger.debug('📕', '[PDF.tsx]', '[extractPDF]', 'extractPDF url:', url);
    const filename = fileNameFromUrl(url);
    return {
      title: filename,
      url: url,
      content: null,
      isSuccess: false,
    };
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
