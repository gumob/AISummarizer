import React, { useEffect, useRef } from 'react';

import { createRoot } from 'react-dom/client';

import { PopupMain } from '@/features/popup/components/main';
import { GlobalContextProvider } from '@/stores';
import '@/styles/globals.css';
import { detectTheme, logger } from '@/utils';

/**
 * The main component for the extension manager.
 * @returns
 */
const Popup: React.FC = () => {
  const isInitialized = useRef(false);
  /**
   * Setup color scheme listener.
   */
  useEffect(() => {
    const initialize = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      logger.debug('📄🍿', '[Popup]', '[useEffect]', 'Initializing popup document');
      await detectTheme();
    };

    initialize();

    return () => {
      isInitialized.current = false;
      logger.debug('📄🍿', '[Popup]', '[useEffect]', 'Deinitializing popup document');
    };
  }, []);

  /**
   * Render the component.
   * @returns
   */
  return (
    <GlobalContextProvider>
      <PopupMain />
    </GlobalContextProvider>
  );
};

/**
 * The container element.
 */
const container = document.getElementById('root');

/**
 * The root element.
 */
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
