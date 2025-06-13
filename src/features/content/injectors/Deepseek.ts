import {
  getRandomInt,
  logger,
  waitForElement,
} from '@/utils';

export async function injectDeepSeek(prompt: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[DeepSeek.tsx]', '[injectDeepSeek]', 'Injecting article into DeepSeek\n', prompt);

    /** Wait for 2 seconds to ensure page is fully loaded */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(2000, 3000)));

    /** Wait for the editor to be found */
    const editor = await waitForElement('#chat-input');
    if (!editor) throw new Error('DeepSeek container not found');
    logger.debug('📕', '[DeepSeek.tsx]', '[injectDeepSeek]', 'DeepSeek editor found', editor);

    /** Set the value and trigger input event */
    if (editor instanceof HTMLTextAreaElement) {
      editor.value = prompt;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
      editor.dispatchEvent(new Event('blur', { bubbles: true }));
    } else {
      throw new Error('DeepSeek editor is not a textarea element');
    }

    /** Wait for 1 to 1.5 seconds */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(1000, 1500)));

    /** Wait for the submit button to be found */
    const submitButton = await waitForElement('div[role="button"][aria-disabled="false"] svg[width="14"][height="16"]');
    if (!submitButton) throw new Error('DeepSeek submit button not found');
    logger.debug('📕', '[DeepSeek.tsx]', '[injectDeepSeek]', 'DeepSeek submit button found', submitButton);

    /** Click the submit button */
    const buttonElement = submitButton.closest('div[role="button"]');
    if (buttonElement instanceof HTMLElement) {
      buttonElement.click();
    } else {
      throw new Error('DeepSeek submit button not found');
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    logger.error('📕', '[DeepSeek.tsx]', '[injectDeepSeek]', 'Failed to inject article into DeepSeek:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to inject article into DeepSeek'),
    };
  }
}
