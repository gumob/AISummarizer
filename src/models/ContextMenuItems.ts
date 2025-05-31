export const MENU_ITEMS = {
  ROOT: {
    id: 'root',
    title: 'Summarize this page with',
    contexts: ['page' as const],
  },
  AI_SERVICES: [
    {
      id: 'chatgpt',
      title: 'ChatGPT',
      contexts: ['page' as const],
    },
    {
      id: 'gemini',
      title: 'Gemini',
      contexts: ['page' as const],
    },
    {
      id: 'claude',
      title: 'Claude',
      contexts: ['page' as const],
    },
    {
      id: 'grok',
      title: 'Grok',
      contexts: ['page' as const],
    },
    {
      id: 'perplexity',
      title: 'Perplexity',
      contexts: ['page' as const],
    },
    {
      id: 'deepseek',
      title: 'Deepseek',
      contexts: ['page' as const],
    },
  ],
  DIVIDER: {
    type: 'separator' as chrome.contextMenus.ItemType,
    contexts: ['page' as const],
  },
  COPY: {
    id: 'copy',
    title: 'Copy to clipboard',
    contexts: ['page' as const],
  },
  SETTINGS: {
    id: 'settings',
    title: 'Settings',
    contexts: ['page' as const],
  },
  NOT_AVAILABLE: {
    id: 'root',
    title: 'Not Available',
    contexts: ['page' as const],
  },
};
