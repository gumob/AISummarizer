import React from 'react';

import { ServiceIcon } from '@/components';
import { AIService } from '@/types';

/**
 * The props for the ServiceListMenu component.
 *
 * @param service - The service to display.
 * @param onClick - The click handler.
 */
interface ServiceListMenuProps {
  service: AIService;
  onClick: (service: AIService) => void;
}

/**
 * The ServiceListMenu component.
 *
 * @param service - The service to display.
 * @param onClick - The click handler.
 * @returns The ServiceListMenu component.
 */
export const ServiceListMenu: React.FC<ServiceListMenuProps> = ({ service, onClick }: ServiceListMenuProps) => {
  /**
   * The ServiceListMenu component.
   *
   * @returns The ServiceListMenu component.
   */
  return (
      <button onClick={() => onClick(service)} className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
        <ServiceIcon service={service} />
        {service}
      </button>
  );
};
