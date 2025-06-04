import React from 'react';

import { FloatButton } from '@/features/content/components/main';
import { useContentContext } from '@/stores/ContentContext';

export const ContentMain: React.FC = () => {
  const { isFloatButtonVisible } = useContentContext();

  return <FloatButton isVisible={isFloatButtonVisible} />;
};
