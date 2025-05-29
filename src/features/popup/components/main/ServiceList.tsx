import React from 'react';

import { useExtensionContext } from '@/contexts';
import { ServiceListButton } from '@/features/popup/components/main';
import { useTagStore } from '@/stores';
import { AIService } from '@/types';
import { logger } from '@/utils';

/**
 * The component for displaying a list of extensions.
 * @returns
 */
export const ServiceList: React.FC = () => {
  /*******************************************************
   * State Management
   *******************************************************/

  const { taggedExtensions, untaggedExtensions, visibleTagId } = useExtensionContext();
  const { tags } = useTagStore();

  /*******************************************************
   * Render the component
   *******************************************************/

  return (
    <div className="flex flex-wrap gap-2 pb-4 pl-4 pr-3">
      {Object.entries(AIService).map(([serviceName, service]) => (
        <div key={service} className="space-y-2">
          <ServiceListButton
            service={service}
            onClick={(service: AIService) => {
              logger.debug('Service clicked:', service);
            }}
          />
        </div>
      ))}
    </div>
  );
};
