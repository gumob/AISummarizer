import React from 'react';

import { FloatButton } from '@/features/content/components/main/FloatButton';
import { useFloatButton } from '@/hooks/useFloatButton';

export const ContentMain: React.FC = () => {
  const { isVisible } = useFloatButton();

  return (
    <>
      <FloatButton isVisible={isVisible} />
    </>
  );
};
