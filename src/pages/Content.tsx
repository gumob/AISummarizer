import React from 'react';

import { createRoot } from 'react-dom/client';

import { ContentMain } from '@/features/content/components/main';
import { ContentContextProvider } from '@/features/content/contexts/ContentContext';
import { logger } from '@/utils';

logger.debug('📄🥡', 'Content script loaded');

/**
 * The main component for the content script.
 * @returns
 */
const Content: React.FC = () => {
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
const container = document.createElement('div');
container.id = 'ai-summarizer-root';

/** Create a shadow root */
const shadowRoot = container.attachShadow({ mode: 'open' });

/** Create a style element for the shadow DOM */
const style = document.createElement('style');

/** Get all stylesheets from the document */
const stylesheets = Array.from(document.styleSheets);
const cssText = stylesheets
  .map(sheet => {
    try {
      return Array.from(sheet.cssRules)
        .map(rule => rule.cssText)
        .join('\n');
    } catch (e) {
      return '';
    }
  })
  .join('\n');

/** Load globals.css content */
fetch(chrome.runtime.getURL('globals.css'))
  .then(response => response.text())
  .then(globalsCss => {
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
      ${cssText}
    `;
  });

/** Create a container for the React app inside the shadow DOM */
const reactContainer = document.createElement('div');
reactContainer.id = 'ai-summarizer-react-root';

/** Append elements to the shadow DOM */
shadowRoot.appendChild(style);
shadowRoot.appendChild(reactContainer);
document.body.appendChild(container);

/** Render the React app */
const root = createRoot(reactContainer);
root.render(<Content />);
