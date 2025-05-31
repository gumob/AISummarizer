import React from 'react';

/**
 * Card component props.
 */
interface OptionCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card component.
 * @param props - The component props.
 * @returns
 */
export const OptionCard: React.FC<OptionCardProps> = ({ children, className = '' }) => {
  return <div className={`p-2  ${className}`}>{children}</div>;
};
