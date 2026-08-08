import { getRandomInt, logger, waitForElement } from '@/utils';

export async function injectQwen(prompt: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[Qwen.tsx]', '[injectQwen]', 'Injecting article into Qwen\n', prompt);

    /** Wait for 2 to 3 seconds to ensure page is fully loaded */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(2000, 3000)));

    /** Wait for the editor to be found. The chat box is the sole textarea on the page (verified live 2026-08-08) */
    const editor = await waitForElement('textarea.message-input-textarea, textarea');
    if (!editor) throw new Error('Qwen container not found');
    logger.debug('📕', '[Qwen.tsx]', '[injectQwen]', 'Qwen editor found', editor);

    /** Set the value through the native setter so the framework value tracker registers the change */
    if (editor instanceof HTMLTextAreaElement) {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      if (!nativeSetter) throw new Error('Qwen native value setter not found');
      nativeSetter.call(editor, prompt);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      throw new Error('Qwen editor is not a textarea element');
    }

    /** Wait for 1 to 1.5 seconds */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(1000, 1500)));

    /** Wait for the submit button to be found. The button replaces the voice-mode button once text is entered (verified live 2026-08-08) */
    const submitButton = await waitForElement('button.send-button:not([disabled])');
    if (!submitButton) throw new Error('Qwen submit button not found');
    logger.debug('📕', '[Qwen.tsx]', '[injectQwen]', 'Qwen submit button found', submitButton);

    /** Click the submit button */
    if (submitButton instanceof HTMLElement) {
      submitButton.click();
    } else {
      throw new Error('Qwen submit button not found');
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    logger.error('📕', '[Qwen.tsx]', '[injectQwen]', 'Failed to inject article into Qwen:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to inject article into Qwen'),
    };
  }
}
