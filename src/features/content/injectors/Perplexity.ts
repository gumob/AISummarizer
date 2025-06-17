import { getRandomInt, logger, waitForElement } from '@/utils';

export async function injectPerplexity(prompt: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[Perplexity.tsx]', '[injectPerplexity]', 'Injecting article into Perplexity\n', prompt);

    /** Wait for 2 seconds to ensure page is fully loaded */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(2000, 3000)));

    /** Wait for the editor to be found */
    const editor = await waitForElement('#ask-input');
    if (!editor) throw new Error('Perplexity container not found');
    logger.debug('📕', '[Perplexity.tsx]', '[injectPerplexity]', 'Perplexity editor found', editor);

    /** Set the value and trigger input event */
    if (editor instanceof HTMLTextAreaElement) {
      editor.value = prompt;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
      editor.dispatchEvent(new Event('blur', { bubbles: true }));
    } else {
      throw new Error('Perplexity editor is not a textarea element');
    }

    /** Wait for 1 to 1.5 seconds */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(1000, 1500)));

    /** Wait for the submit button to be found */
    const submitButton = await waitForElement('button[aria-label="Submit"]');
    if (!submitButton) throw new Error('Perplexity submit button not found');
    logger.debug('📕', '[Perplexity.tsx]', '[injectPerplexity]', 'Perplexity submit button found', submitButton);

    /** Click the submit button */
    if (submitButton instanceof HTMLElement) {
      submitButton.click();
    } else {
      throw new Error('Perplexity submit button not found');
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    logger.error('📕', '[Perplexity.tsx]', '[injectPerplexity]', 'Failed to inject article into Perplexity:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to inject article into Perplexity'),
    };
  }
}
