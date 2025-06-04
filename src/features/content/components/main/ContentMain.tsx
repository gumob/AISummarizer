import React from 'react';

import { FloatButton } from '@/features/content/components/main';
import { useFloatButton } from '@/hooks';

export const ContentMain: React.FC = () => {
  const { isVisible } = useFloatButton();

  return <FloatButton isVisible={isVisible} />;
};
