import React from 'react';

interface HeaderProps {
  children: React.ReactNode;
}

/**
 * The component for managing profile export/import.
 * @returns The ExtensionHeader component
 */
export const Header: React.FC<HeaderProps> = ({ children }: HeaderProps) => {
  return <h1 className="text-lg font-bold">{children}</h1>;
};
