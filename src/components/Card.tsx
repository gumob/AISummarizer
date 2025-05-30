import React from 'react';

/**
 * Card component props.
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card component.
 * @param props - The component props.
 * @returns
 */
export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`rounded-xl bg-white p-6 shadow-lg shadow-zinc-300 dark:bg-zinc-800 dark:shadow-zinc-900 ${className}`}>{children}</div>;
};
