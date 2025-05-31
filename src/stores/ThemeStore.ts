import { create } from 'zustand';

import { updateExtensionIcon } from '@/utils';

interface ThemeStore {
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>(set => ({
  isDarkMode: false,
  setDarkMode: isDark => {
    updateExtensionIcon(isDark);
    set({ isDarkMode: isDark });
  },
}));
