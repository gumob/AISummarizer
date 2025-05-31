import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { chromeAPI } from '@/api';
import { STORAGE_KEYS } from '@/constants';
import {
  AIService,
  FloatButtonPosition,
  TabBehavior,
} from '@/types';

interface SettingsState {
  prompts: {
    [key in AIService]: string;
  };
  tabBehavior: TabBehavior;
  floatButtonPosition: FloatButtonPosition;
}

const DEFAULT_PROMPT = `Extract each theme from the following text without omission and summarize the main points in Japanese.

# Title
{title}

# URL
{url}

# Content
{content}`;

const DEFAULT_SETTINGS: SettingsState = {
  prompts: {
    [AIService.CHATGPT]: DEFAULT_PROMPT,
    [AIService.GEMINI]: DEFAULT_PROMPT,
    [AIService.CLAUDE]: DEFAULT_PROMPT,
    [AIService.GROK]: DEFAULT_PROMPT,
    [AIService.PERPLEXITY]: DEFAULT_PROMPT,
    [AIService.DEEPSEEK]: DEFAULT_PROMPT,
  },
  tabBehavior: TabBehavior.CURRENT_TAB,
  floatButtonPosition: FloatButtonPosition.HIDE,
};

interface SettingsStore extends SettingsState {
  prompt: (service: AIService) => string;
  setPrompt: (service: AIService, prompt: string) => void;
  setTabBehavior: (tabBehavior: TabBehavior) => void;
  setFloatButtonPosition: (floatButtonPosition: FloatButtonPosition) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      prompt: (service: AIService) => get().prompts[service],
      setPrompt: (service: AIService, prompt: string) =>
        set(state => ({
          prompts: {
            ...state.prompts,
            [service]: prompt,
          },
        })),
      setTabBehavior: (tabBehavior: TabBehavior) =>
        set(() => ({
          tabBehavior,
        })),
      setFloatButtonPosition: (floatButtonPosition: FloatButtonPosition) =>
        set(() => ({
          floatButtonPosition,
        })),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: {
        /**
         * Custom storage getter that loads data from Chrome storage
         * Handles errors and logs them appropriately
         */
        getItem: async (name: string) => {
          const result = await chromeAPI.getLocalStorage(name);
          return result[name];
        },
        /**
         * Custom storage setter that saves data to Chrome storage
         * Handles errors and logs them appropriately
         */
        setItem: async (name: string, value: any) => {
          await chromeAPI.setLocalStorage({ [name]: value });
        },
        /**
         * Custom storage remover that deletes data from Chrome storage
         * Handles errors and logs them appropriately
         */
        removeItem: async (name: string) => {
          await chromeAPI.removeLocalStorage(name);
        },
      },
    }
  )
);
