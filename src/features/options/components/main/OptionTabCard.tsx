import React from 'react';

import clsx from 'clsx';

import {
  Tab,
  TabGroup,
  TabList,
} from '@headlessui/react';

import { OptionCard } from './OptionCard';

/**
 * Card component props.
 */
interface OptionTabCardProps {
  title: string;
  selectedIndex: number;
  onChange: (index: number) => void;
  onSelect: (value: any) => void;
  options: {
    [key: string]: any;
  };
  getLabel: (key: any) => string;
}

/**
 * Card component.
 * @param props - The component props.
 * @returns
 */
export const OptionTabCard: React.FC<OptionTabCardProps> = ({ title, selectedIndex, onChange, onSelect, options, getLabel }) => {
  return (
    <OptionCard>
      <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <TabGroup selectedIndex={selectedIndex} onChange={onChange}>
        <TabList className="flex flex-wrap gap-2">
          {Object.entries(options).map(([name, value]: [string, any], index) => (
            <Tab
              key={name}
              className={clsx(
                'rounded-full px-3 py-1 font-semibold',
                'text-zinc-900 dark:text-zinc-50',
                'bg-zinc-300 dark:bg-zinc-700',
                'opacity-30 dark:opacity-30',
                'hover:opacity-100',
                selectedIndex === index && '!opacity-100',
                'focus:outline-none',
                'transition-opacity'
              )}
              onClick={() => onSelect(value)}
            >
              {getLabel(name)}
            </Tab>
          ))}
        </TabList>
      </TabGroup>
    </OptionCard>
  );
};
