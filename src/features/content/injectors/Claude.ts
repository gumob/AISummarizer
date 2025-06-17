import { getRandomInt, logger, waitForElement } from '@/utils';

export async function injectClaude(prompt: string): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.debug('📕', '[Claude.tsx]', '[injectClaude]', 'Injecting article into Claude', prompt);

    /** Wait for 2 to 3 seconds */
    new Promise(resolve => setTimeout(resolve, getRandomInt(2000, 3000)));

    /** Wait for the editor to be found */
    const editor = await waitForElement('div.ProseMirror[contenteditable="true"]');
    if (!editor) throw new Error('Claude container not found');
    logger.debug('📕', '[Claude.tsx]', '[injectClaude]', 'Claude editor found', editor);

    /** Format the article for clipboard */
    const paragraphs = prompt.split(/\r?\n/).map(line => {
      if (line.trim() === '') {
        return '<p><br class="ProseMirror-trailingBreak"></p>';
      }
      return `<p>${line}</p>`;
    });

    /** Inject the article into the editor */
    editor.innerHTML = paragraphs.join('');
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    /** Wait for 1.5 to 2 seconds */
    new Promise(resolve => setTimeout(resolve, getRandomInt(1500, 2000)));

    /** Wait for the submit button to be found */
    const submitButton = await waitForElement('button[aria-label="Send message"]');
    if (!submitButton) throw new Error('Claude submit button not found');
    logger.debug('📕', '[Claude.tsx]', '[injectClaude]', 'Claude submit button found', submitButton);

    /** Click the submit button */
    if (submitButton instanceof HTMLElement) {
      submitButton.click();
    } else {
      throw new Error('Claude submit button not found');
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    logger.error('📕', '[Claude.tsx]', '[injectClaude]', 'Failed to inject article into Claude:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to inject article into Claude'),
    };
  }
}
