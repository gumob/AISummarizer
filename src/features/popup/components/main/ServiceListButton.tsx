import React from 'react';

import { DefaultBackgroundButton } from '@/components';
import { AIService } from '@/types';

/**
 * The props for the ServiceListButton component.
 *
 * @param service - The service to display.
 * @param onClick - The click handler.
 */
interface ServiceListButtonProps {
  service: AIService;
  onClick: (service: AIService) => void;
}

/**
 * The ServiceListButton component.
 *
 * @param service - The service to display.
 * @param onClick - The click handler.
 * @returns The ServiceListButton component.
 */
export const ServiceListButton: React.FC<ServiceListButtonProps> = ({ service, onClick }: ServiceListButtonProps) => {
  /**
   * The ServiceListButton component.
   *
   * @returns The ServiceListButton component.
   */
  return (
    <DefaultBackgroundButton onClick={() => onClick(service)} className={`ps-3 pe-2 py-1 text-sm font-medium rounded-l-full mr-[1px]`}>
      {service}
    </DefaultBackgroundButton>
  );
};
