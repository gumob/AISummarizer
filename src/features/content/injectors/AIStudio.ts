import {
  getRandomInt,
  logger,
  waitForElement,
} from '@/utils';

export async function injectAIStudio(prompt: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[AIStudio.tsx]', '[injectAIStudio]', 'Injecting article into AIStudio\n', prompt);

    /** Wait for 2 seconds to ensure page is fully loaded */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(2000, 3000)));

    /** Wait for the thinking mode button to be found */
    const thinkingButton = await waitForElement('#mat-mdc-slide-toggle-1-button');
    if (!thinkingButton) throw new Error('AIStudio thinking button not found');
    logger.debug('📕', '[AIStudio.tsx]', '[injectAIStudio]', 'AIStudio thinking button found', thinkingButton);

    /** Click the thinking button if it is checked */
    const isThinkingButtonChecked = thinkingButton.getAttribute('aria-checked') === 'true';
    if (isThinkingButtonChecked) {
      if (thinkingButton instanceof HTMLElement) {
        thinkingButton.click();
      }
    }

    /** Wait for 0.5 to 1 second before checking button state */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(500, 1000)));

    /** Wait for the url context button to be found */
    const urlContextButton = await waitForElement('#mat-mdc-slide-toggle-7-button');
    if (!urlContextButton) throw new Error('AIStudio url context button not found');
    logger.debug('📕', '[AIStudio.tsx]', '[injectAIStudio]', 'AIStudio url context button found', urlContextButton);

    /** Click the url context button if it is not checked */
    const isUrlContextButtonChecked = urlContextButton.getAttribute('aria-checked') === 'true';
    if (!isUrlContextButtonChecked) {
      if (urlContextButton instanceof HTMLElement) {
        urlContextButton.click();
      }
    }

    /** Wait for 0.5 to 1 second before checking button state */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(500, 1000)));

    /** Wait for the editor to be found */
    const editor = await waitForElement('ms-autosize-textarea textarea');
    if (!editor) throw new Error('AIStudio container not found');
    logger.debug('📕', '[AIStudio.tsx]', '[injectAIStudio]', 'AIStudio editor found', editor);

    /** Set the value and trigger input event */
    if (editor instanceof HTMLTextAreaElement) {
      editor.value = prompt;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      throw new Error('AIStudio editor is not a textarea element');
    }

    /** Wait for 0.5 to 1 second */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(500, 1000)));

    /** Wait for the submit button to be found */
    const submitButton = await waitForElement('button.run-button');
    if (!submitButton) throw new Error('AIStudio submit button not found');
    logger.debug('📕', '[AIStudio.tsx]', '[injectAIStudio]', 'AIStudio submit button found', submitButton);

    /** Click the submit button */
    if (submitButton instanceof HTMLElement) {
      submitButton.click();
    } else {
      throw new Error('AIStudio submit button not found');
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    logger.error('📕', '[AIStudio.tsx]', '[injectAIStudio]', 'Failed to inject article into AIStudio:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to inject article into AIStudio'),
    };
  }
}
