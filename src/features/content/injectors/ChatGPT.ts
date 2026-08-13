import { getRandomInt, logger, waitForElement } from '@/utils';

export async function injectChatGPT(promptText: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[ChatGPT.tsx]', '[injectChatGPT]', 'Injecting article into ChatGPT', promptText);

    /** Wait for 2 to 3 seconds */
    new Promise(resolve => setTimeout(resolve, getRandomInt(2000, 3000)));

    /*
     * Wait for the editor to be found. The logged-in composer is a ProseMirror
     * contenteditable div (#prompt-textarea); the logged-out guest composer is a
     * plain React-controlled textarea (name="prompt", seen in incognito windows;
     * verified live 2026-08-13).
     */
    const editor = await waitForElement('#prompt-textarea, form textarea[name="prompt"]');
    if (!editor) throw new Error('ChatGPT container not found');
    logger.debug('📕', '[ChatGPT.tsx]', '[injectChatGPT]', 'ChatGPT editor found', editor);

    /** Wait for 0.5 to 1 second */
    new Promise(resolve => setTimeout(resolve, getRandomInt(500, 1000)));

    if (editor instanceof HTMLTextAreaElement) {
      /** Set the value through the native setter so the framework value tracker registers the change */
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      if (!nativeSetter) throw new Error('ChatGPT native value setter not found');
      nativeSetter.call(editor, promptText);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      /** Format the article as ProseMirror paragraphs */
      const paragraphs = promptText.split(/\r?\n/).map(line => {
        if (line.trim() === '') {
          return '<p><br class="ProseMirror-trailingBreak"></p>';
        }
        return `<p>${line}</p>`;
      });

      /** Inject the article into the editor */
      editor.innerHTML = paragraphs.join('');
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /** Wait for 0.5 to 1 second */
    new Promise(resolve => setTimeout(resolve, getRandomInt(500, 1000)));

    /*
     * Wait for the submit button to be found. The logged-in composer exposes
     * #composer-submit-button / data-testid="send-button"; the guest composer has
     * neither and is only reachable via its aria-label, which stays English
     * regardless of browser locale (verified live 2026-08-13).
     */
    const submitButton = await waitForElement('#composer-submit-button, button[data-testid="send-button"], form button[aria-label="Send message"]');
    if (!submitButton) throw new Error('ChatGPT submit button not found');
    logger.debug('📕', '[ChatGPT.tsx]', '[injectChatGPT]', 'ChatGPT submit button found', submitButton);

    /** Click the submit button */
    if (submitButton instanceof HTMLElement) {
      submitButton.click();
    } else {
      throw new Error('ChatGPT submit button not found');
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    logger.error('📕', '[ChatGPT.tsx]', '[injectChatGPT]', 'Failed to inject article into ChatGPT:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to inject article into ChatGPT'),
    };
  }
}
