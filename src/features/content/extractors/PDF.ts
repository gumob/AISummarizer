import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

import { ArticleExtractionResult } from '@/types';
import { fileNameFromUrl, logger } from '@/utils';

GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');

export async function extractPDF(url: string): Promise<ArticleExtractionResult> {
  try {
    logger.debug('📕', '[PDF.tsx]', '[extractPDF]', 'extractPDF url:', url);

    /**
     * Extract text from PDF
     */
    /* Read PDF file */
    const buffer: ArrayBuffer = await fetch(url).then(res => res.arrayBuffer());
    const pdfData = new Uint8Array(buffer);
    /* Extract text from PDF */
    const pdf = await getDocument(pdfData).promise;
    const metadata = await pdf.getMetadata();
    const title = (metadata.info as Record<string, any>)?.Title || metadata.metadata?.get('dc:title') || fileNameFromUrl(url);
    logger.debug('📕', '[PDF.tsx]', '[extractPDF]', 'metadata:', metadata);
    const maxPages = pdf.numPages;
    let text = '';
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ');
      text += pageText;
    }
    logger.debug('📕', '[PDF.tsx]', '[extractPDF]', 'text:', text);
    logger.debug('📕', '[PDF.tsx]', '[extractPDF]', 'title:', title);
    pdf.destroy();

    return {
      title: title,
      url: url,
      content: text,
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
