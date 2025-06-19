import { PDFDocument } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

import { ArticleExtractionResult } from '@/types';
import { fileNameFromUrl, logger } from '@/utils';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

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
    const maxPages = pdf.numPages;
    let text = '';
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => ('str' in item ? item.str : '')).join('\n');
      text += pageText + '\n';
    }
    logger.debug('📕', '[PDF.tsx]', '[extractPDF]', 'text:', text);

    /**
     * Extract title from PDF
     */
    const pdfDoc = await PDFDocument.load(buffer);
    const title = pdfDoc.getTitle() || fileNameFromUrl(url);
    logger.debug('📕', '[PDF.tsx]', '[extractPDF]', 'title:', title);

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
