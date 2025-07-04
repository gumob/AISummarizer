import React, { useEffect } from 'react';

import { createRoot } from 'react-dom/client';

import { ContentMain } from '@/features/content/components/main';
import { ContentContextProvider } from '@/features/content/contexts/ContentContext';
import { logger } from '@/utils';

logger.debug('📄🥡', '[Content.tsx]', 'Content script loaded');

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
          #free-ai-summarizer-root {
            all: initial;
            font-family: system-ui, -apple-system, sans-serif;
          }
          #free-ai-summarizer-react-root {
            all: initial;
            font-family: system-ui, -apple-system, sans-serif;
          }
          ${globalsCss}
        `;

        /** Create a shadow root */
        const shadowRoot = document.getElementById('free-ai-summarizer-root')?.shadowRoot;

        /** Append elements to the shadow DOM */
        shadowRoot?.prepend(style);
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
rootContainer.id = 'free-ai-summarizer-root';
document.body.appendChild(rootContainer);

/** Create a container for the React app inside the shadow DOM */
const reactContainer = document.createElement('div');
reactContainer.id = 'free-ai-summarizer-react-root';

const shadowRoot = rootContainer.attachShadow({ mode: process.env.NODE_ENV === 'development' ? 'open' : 'closed' });
shadowRoot?.appendChild(reactContainer);

/** Render the React app */
const root = createRoot(reactContainer);
root.render(<Content />);
