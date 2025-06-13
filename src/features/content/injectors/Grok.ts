import {
  logger,
  waitForElement,
} from '@/utils';

export async function injectGrok(prompt: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[Grok.tsx]', '[injectGrok]', 'Injecting article into Grok', prompt);

    /** Wait for 1 second */
    new Promise(resolve => setTimeout(resolve, 1000));

    /** Wait for the editor to be found */
    const editor = await waitForElement('#prompt-textarea');
    if (!editor) throw new Error('Grok container not found');
    logger.debug('📕', '[Grok.tsx]', '[injectGrok]', 'Grok editor found', editor);

    /** Format the article for clipboard */
    const paragraphs = prompt.split(/\r?\n/).map(line => {
      if (line.trim() === '') {
        return '<p><br class="ProseMirror-trailingBreak"></p>';
      }
      return `<p>${line}</p>`;
    });

    /** Wait for 1 second */
    new Promise(resolve => setTimeout(resolve, 1000));

    /** Inject the article into the editor */
    editor.innerHTML = paragraphs.join('');
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    /** Wait for 1 second */
    new Promise(resolve => setTimeout(resolve, 1000));

    /** Wait for the submit button to be found */
    const submitButton = await waitForElement('#composer-submit-button');
    if (!submitButton) throw new Error('Grok submit button not found');
    logger.debug('📕', '[Grok.tsx]', '[injectGrok]', 'Grok submit button found', submitButton);

    /** Click the submit button */
    if (submitButton instanceof HTMLElement) {
      submitButton.click();
    } else {
      throw new Error('Grok submit button not found');
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    logger.error('📕', '[Grok.tsx]', '[injectGrok]', 'Failed to inject article into Grok:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to inject article into Grok'),
    };
  }
}
