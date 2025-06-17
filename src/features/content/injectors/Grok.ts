import { getRandomInt, logger, waitForElement } from '@/utils';

export async function injectGrok(prompt: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[Grok.tsx]', '[injectGrok]', 'Injecting article into Grok', prompt);

    /** Wait for 2 to 3 seconds */
    new Promise(resolve => setTimeout(resolve, getRandomInt(2000, 3000)));

    /** Wait for the editor to be found */
    const editor = await waitForElement('textarea[aria-label="Ask Grok anything"]');
    if (!editor) throw new Error('Grok container not found');
    logger.debug('📕', '[Grok.tsx]', '[injectGrok]', 'Grok editor found', editor);

    /** Set the prompt text using React's value setter */
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    nativeInputValueSetter?.call(editor, prompt);
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    /** Wait for 1 to 1.5 seconds */
    new Promise(resolve => setTimeout(resolve, getRandomInt(1000, 1500)));

    /** Wait for the submit button to be found */
    const submitButton = await waitForElement('button[aria-label="Submit"]');
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
