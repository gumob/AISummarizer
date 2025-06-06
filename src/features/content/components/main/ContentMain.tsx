import React from 'react';

import { FloatPanel } from '@/features/content/components/main';

export const ContentMain: React.FC = () => {
  /**
   * Render the component
   */
  return (
    <>
      <FloatPanel />
      {/* <Toaster
        position="top-center"
        containerClassName="top-10"
        toastOptions={{
          className: clsx(
            '!px-4 py-2',
            '!text-zinc-900 dark:!text-zinc-100',
            '!bg-white dark:!bg-zinc-700',
            '!rounded-full',
            '!shadow-lg shadow-zinc-300 dark:shadow-zinc-900',
            'transition-all duration-300'
          ),
          duration: 3000,
          style: {
            zIndex: 777777777777,
          },
        }}
        containerStyle={{
          zIndex: 777777777777,
        }}
      /> */}
    </>
  );
};
