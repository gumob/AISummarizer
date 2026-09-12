/**
 * Minimal declarations for the Firefox-only WebExtension APIs used by src/platform/firefox.ts
 */
declare namespace browser.sidebarAction {
  /**
   * Open the sidebar. Must be called synchronously from a user input handler.
   */
  function open(): Promise<void>;

  /**
   * Close the sidebar. Must be called synchronously from a user input handler.
   */
  function close(): Promise<void>;
}
