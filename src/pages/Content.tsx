import React, { useEffect } from 'react';

import clsx from 'clsx';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import { ContentMain } from '@/features/content/components/main';
import { ContentContextProvider } from '@/features/content/contexts/ContentContext';
import { logger } from '@/utils';

logger.debug('📄🥡', 'Content script loaded');

/**
 * The main component for the content script.
 * @returns
 */
const Content: React.FC = () => {
  useEffect(() => {
    /** Load globals.css content */
    fetch(chrome.runtime.getURL('globals.css'))
      .then(response => response.text())
      .then(globalsCss => {
        /** Create a style element for the shadow DOM */
        const style = document.createElement('style');
        style.textContent = `
          :host {
            all: initial;
          }
          #ai-summarizer-root {
            all: initial;
            font-family: system-ui, -apple-system, sans-serif;
          }
          #ai-summarizer-react-root {
            all: initial;
            font-family: system-ui, -apple-system, sans-serif;
          }
          ${globalsCss}
        `;

        /** Create a shadow root */
        const shadowRoot = rootContainer.attachShadow({ mode: process.env.NODE_ENV === 'development' ? 'open' : 'closed' });

        /** Append elements to the shadow DOM */
        shadowRoot?.appendChild(style);
        shadowRoot?.appendChild(reactContainer);
      });
  }, []);

  /**
   * Render the component.
   * @returns
   */
  return (
    <ContentContextProvider>
      <ContentMain />
    </ContentContextProvider>
  );
};

/** Create a container for the React app */
const rootContainer = document.createElement('div');
rootContainer.id = 'ai-summarizer-root';
document.body.appendChild(rootContainer);

/** Create a container for the React app inside the shadow DOM */
const reactContainer = document.createElement('div');
reactContainer.id = 'ai-summarizer-react-root';

/** Render the React app */
const root = createRoot(reactContainer);
root.render(<Content />);

/** Create a container for the Toaster outside of shadow DOM */
const toasterContainer = document.createElement('div');
toasterContainer.id = 'ai-summarizer-toaster';
document.body.appendChild(toasterContainer);

/** Render the Toaster */
const toasterRoot = createRoot(toasterContainer);
toasterRoot.render(
  <Toaster
    position="top-center"
    containerClassName="!top-10"
    toastOptions={{
      className: clsx(
        '!px-4 py-2',
        '!rounded-full',
        '!text-zinc-900 dark:!text-zinc-100',
        '!bg-white dark:!bg-zinc-700',
        '!shadow-lg shadow-zinc-300 dark:shadow-zinc-900'
      ),
      duration: 3000,
      style: {
        zIndex: 777777777777,
      },
    }}
    containerStyle={{
      zIndex: 777777777777,
    }}
  />
);
