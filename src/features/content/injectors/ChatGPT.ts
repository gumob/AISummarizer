import { getRandomInt, logger, waitForElement } from '@/utils';

export async function injectChatGPT(promptText: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[ChatGPT.tsx]', '[injectChatGPT]', 'Injecting article into ChatGPT', promptText);

    /** Wait for 2 to 3 seconds */
    new Promise(resolve => setTimeout(resolve, getRandomInt(2000, 3000)));

    /** Wait for the editor to be found */
    const editor = await waitForElement('#prompt-textarea');
    if (!editor) throw new Error('ChatGPT container not found');
    logger.debug('📕', '[ChatGPT.tsx]', '[injectChatGPT]', 'ChatGPT editor found', editor);

    /** Wait for 0.5 to 1 second */
    new Promise(resolve => setTimeout(resolve, getRandomInt(500, 1000)));

    /** Format the article for clipboard */
    const paragraphs = promptText.split(/\r?\n/).map(line => {
      if (line.trim() === '') {
        return '<p><br class="ProseMirror-trailingBreak"></p>';
      }
      return `<p>${line}</p>`;
    });

    /** Inject the article into the editor */
    editor.innerHTML = paragraphs.join('');
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    /** Wait for 0.5 to 1 second */
    new Promise(resolve => setTimeout(resolve, getRandomInt(500, 1000)));

    /** Wait for the submit button to be found */
    const submitButton = await waitForElement('#composer-submit-button');
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
