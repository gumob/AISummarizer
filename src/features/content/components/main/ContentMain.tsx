import React from 'react';

import { FloatPanel } from '@/features/content/components/main';
import { Toaster } from '@/features/content/components/main/Toaster';

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
