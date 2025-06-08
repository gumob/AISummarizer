import React from 'react';

/**
 * Card component props.
 */
interface OptionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Card component.
 * @param props - The component props.
 * @returns
 */
export const OptionCard: React.FC<OptionCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`p-2`}>
      <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <div className={`${className}`}>{children}</div>
    </div>
  );
};
