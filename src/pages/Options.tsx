import '@/styles/globals.css';

import React, {
  useEffect,
  useRef,
} from 'react';

import { createRoot } from 'react-dom/client';

import { OptionsMain } from '@/features/options/components/main';
import { GlobalContextProvider } from '@/stores';
import {
  detectTheme,
  logger,
} from '@/utils';

/**
 * The main component for the options page.
 * @returns
 */
const Options: React.FC = () => {
  const isInitialized = useRef(false);

  /**
   * Setup color scheme listener.
   */
  useEffect(() => {
    const initialize = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      logger.debug('📄⌥', 'Initializing options document');
      await detectTheme();
    };

    initialize();

    return () => {
      isInitialized.current = false;
      logger.debug('📄⌥', 'Deinitializing options document');
    };
  }, []);

  /**
   * Render the component.
   * @returns
   */
  return (
    <GlobalContextProvider>
      <OptionsMain />
    </GlobalContextProvider>
  );
};

// Create root and render
const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
