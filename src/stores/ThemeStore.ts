import { create } from 'zustand';

import { ThemeState } from '@/types';
import { updateExtensionIcon } from '@/utils';

interface ThemeStore extends ThemeState {
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>(set => ({
  isDarkMode: false,
  setDarkMode: isDark => {
    updateExtensionIcon(isDark);
    set({ isDarkMode: isDark });
  },
}));
