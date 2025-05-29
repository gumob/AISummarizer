import React from 'react';

import {
  Header,
  ServiceList,
} from '@/features/popup/components/main';

/**
 * The component for managing extensions.
 * @returns
 */
export const PopupMain: React.FC = () => {
  /**
   * The main component.
   * @returns
   */
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <div className="container mx-auto flex flex-col h-full gap-3">
        <div className="flex flex-col gap-3 px-4 pt-4 pb-0">
          <Header />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="h-full">
            <ServiceList />
          </div>
        </div>
      </div>
    </main>
  );
};
