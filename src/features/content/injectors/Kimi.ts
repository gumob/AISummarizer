import { getRandomInt, logger, waitForElement } from '@/utils';

export async function injectKimi(prompt: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[Kimi.tsx]', '[injectKimi]', 'Injecting article into Kimi\n', prompt);

    /** Wait for 2 to 3 seconds to ensure page is fully loaded */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(2000, 3000)));

    /** Wait for the editor to be found. The chat box is a Lexical contenteditable div (verified live 2026-08-08) */
    const editor = await waitForElement('div[contenteditable="true"][data-lexical-editor="true"]');
    if (!editor) throw new Error('Kimi container not found');
    logger.debug('📕', '[Kimi.tsx]', '[injectKimi]', 'Kimi editor found', editor);

    /**
     * Inject the article via execCommand so the Lexical editor state stays in sync.
     * Setting innerHTML fills the DOM but leaves the app state empty, in which
     * case the message is never sent.
     */
    if (!(editor instanceof HTMLElement)) throw new Error('Kimi editor is not an HTML element');
    editor.focus();
    document.execCommand('insertText', false, prompt);

    /** Wait for 1 to 1.5 seconds */
    await new Promise(resolve => setTimeout(resolve, getRandomInt(1000, 1500)));

    /** Wait for the submit button to be found. Disabled state is expressed via the disabled class (verified live 2026-08-08) */
    const submitButton = await waitForElement('div.send-button-container:not(.disabled)');
    if (!submitButton) throw new Error('Kimi submit button not found');
    logger.debug('📕', '[Kimi.tsx]', '[injectKimi]', 'Kimi submit button found', submitButton);

    /** Click the submit button */
    if (submitButton instanceof HTMLElement) {
      submitButton.click();
    } else {
      throw new Error('Kimi submit button not found');
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    logger.error('📕', '[Kimi.tsx]', '[injectKimi]', 'Failed to inject article into Kimi:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to inject article into Kimi'),
    };
  }
}
