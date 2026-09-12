/**
 * Browser-specific operations. Everything else keeps using the chrome.* namespace,
 * which Firefox also provides.
 */
export interface Platform {
  /**
   * Open the settings panel (Chrome side panel / Firefox sidebar).
   * Call it before any await in a user gesture handler.
   */
  openSettingsPanel(windowId?: number): Promise<void>;

  /**
   * Close the settings panel
   */
  closeSettingsPanel(): Promise<void>;

  /**
   * Start detecting the OS color scheme
   * @param onColorSchemeChange - Called with the current scheme when the platform reports it directly
   */
  initThemeDetection(onColorSchemeChange: (isDarkMode: boolean) => void): Promise<void>;
}
