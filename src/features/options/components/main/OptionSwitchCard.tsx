import React, { Fragment } from 'react';

import clsx from 'clsx';

import { Switch } from '@headlessui/react';

import { OptionCard } from './OptionCard';

/**
 * Card component props.
 */
interface OptionSwitchCardProps {
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Card component.
 * @param props - The component props.
 * @returns
 */
export const OptionSwitchCard: React.FC<OptionSwitchCardProps> = ({ title, checked, onChange }) => {
  return (
    <OptionCard title={title}>
      <Switch checked={checked} onChange={onChange} as={Fragment}>
        {({ checked, disabled }) => (
          <button
            className={clsx(
              'group inline-flex h-6 w-11 items-center rounded-full',
              checked ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <span className="sr-only">{title}</span>
            <span className={clsx('size-4 rounded-full transition', 'bg-white', checked ? 'translate-x-6' : 'translate-x-1')} />
          </button>
        )}
      </Switch>
    </OptionCard>
  );
};
