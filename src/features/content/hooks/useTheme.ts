import { useEffect } from 'react';

import { detectTheme, logger } from '@/utils';

/**
 * Hook for handling theme detection and updates
 */
export const useTheme = () => {
  useEffect(() => {
    logger.debug('🫳🎨', '[useTheme.tsx]', '[useEffect]', 'mounted');
    const initialize = async () => {
      await detectTheme();
    };
    initialize();
    return () => {
      logger.debug('🫳🎨', '[useTheme.tsx]', '[useEffect]', 'unmounted');
    };
  }, []);
};
