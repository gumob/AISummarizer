import React from 'react';

import {
  FloatPanel,
  Toaster,
} from '@/features/content/components/main';

export const ContentMain: React.FC = () => {
  /**
   * Render the component
   */
  return (
    <>
      <FloatPanel />
      <Toaster position="top-center" duration={2000} />
    </>
  );
};
