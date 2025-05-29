import React from 'react';

import { IoSettingsOutline } from 'react-icons/io5';

import { Divider, ServiceIcon } from '@/components';
import { ServiceListMenu } from '@/features/popup/components/main';
import { AIService } from '@/types';

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
      <div className="container mx-auto h-full flex flex-col items-start gap-1 px-2 pt-2">
        <ServiceListMenu>Summarize this page</ServiceListMenu>
        {Object.entries(AIService).map(([_, service], index) => (
          <ServiceListMenu onClick={() => {}}>
            <ServiceIcon service={service} className="w-4 h-4" />
            {service}
          </ServiceListMenu>
        ))}
        <Divider />
        <ServiceListMenu onClick={() => {}}>
          <IoSettingsOutline className="w-4 h-4" />
          Settings
        </ServiceListMenu>
      </div>
    </main>
  );
};
