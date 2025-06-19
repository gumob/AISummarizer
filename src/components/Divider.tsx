import React from 'react';

/**
 * The Divider component.
 * @returns
 */
export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`w-full h-[1px] bg-zinc-800/20 dark:bg-zinc-100/20 ${className}`} />;
};
