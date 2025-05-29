import React from 'react';

/**
 * The props for the ServiceListMenu component.
 *
 * @param service - The service to display.
 * @param onClick - The click handler.
 */
interface ServiceListMenuProps {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

/**
 * The ServiceListMenu component.
 *
 * @param service - The service to display.
 * @param onClick - The click handler.
 * @returns The ServiceListMenu component.
 */
export const ServiceListMenu: React.FC<ServiceListMenuProps> = ({ className, onClick, children }: ServiceListMenuProps) => {
  /**
   * The ServiceListMenu component.
   *
   * @returns The ServiceListMenu component.
   */
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-2 px-1 py-1 w-full ${onClick ? 'rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors' : ''} ${className}`}
    >
      {children}
    </button>
  );
};
