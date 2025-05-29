import React from 'react';

import { ServiceListMenu } from '@/features/popup/components/main';
import { AIService } from '@/types';

/**
 * The component for displaying a list of extensions.
 * @returns
 */
export const ServiceList: React.FC = () => {
  /*******************************************************
   * Render the component
   *******************************************************/

  return (
    <div className="flex flex-col gap-1 pb-4 pl-4 pr-3">
      {Object.entries(AIService).map(([_, service], index) => (
        <ServiceListMenu service={service} onClick={() => {}} />
      ))}
      
    </div>
  );
};
