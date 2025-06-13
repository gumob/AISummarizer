/**
 * This function is used to wait for an element to be visible.
 * @param selector - The selector of the element.
 * @param attribute - The attribute of the element.
 * @param maxAttempts - The maximum number of attempts.
 * @returns The element if it is visible, otherwise null.
 */
export const waitForElement = async (selector: string, maxAttempts = 10): Promise<Element | null> => {
  for (let i = 0; i < maxAttempts; i++) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return null;
};
