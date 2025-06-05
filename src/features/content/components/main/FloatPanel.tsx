import clsx from 'clsx';

import React from 'react';

import { IoAddOutline } from 'react-icons/io5';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';

import { ServiceIcon } from '@/components/ServiceIcon';
import { useContentContext } from '@/features/content/contexts';
import { SettingsState } from '@/stores/SettingsStore';
import { AIService, FloatPanelPosition } from '@/types';
import { logger } from '@/utils';

/**
 * FloatPopoverButton
 */
interface FloatPopoverButtonProps {
  settings: SettingsState;
}

/**
 * FloatPopoverButton
 * @param settings - The settings state
 * @returns The FloatPopoverButton component
 */
export const FloatPopoverButton: React.FC<FloatPopoverButtonProps> = ({ settings }) => {
  return (
    <PopoverButton
      className={clsx(
        `
          fixed z-[777777777777] flex items-center justify-center
          gap-2 px-4 py-2 rounded-full
          bg-blue-600 hover:bg-blue-700
          text-white shadow-lg
          transition-color duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-zinc-900
          `,
        settings.floatButtonPosition === FloatPanelPosition.TOP_LEFT && '!top-4 !left-4',
        settings.floatButtonPosition === FloatPanelPosition.TOP_CENTER && '!top-4 !left-1/2 -translate-x-1/2',
        settings.floatButtonPosition === FloatPanelPosition.TOP_RIGHT && '!top-4 !right-4',
        settings.floatButtonPosition === FloatPanelPosition.MIDDLE_LEFT && '!left-4 !top-1/2 -translate-y-1/2',
        settings.floatButtonPosition === FloatPanelPosition.MIDDLE_RIGHT && '!right-4 !top-1/2 -translate-y-1/2',
        settings.floatButtonPosition === FloatPanelPosition.BOTTOM_LEFT && '!bottom-4 !left-4',
        settings.floatButtonPosition === FloatPanelPosition.BOTTOM_CENTER && '!bottom-4 !left-1/2 -translate-x-1/2',
        settings.floatButtonPosition === FloatPanelPosition.BOTTOM_RIGHT && '!bottom-4 !right-4'
      )}
    >
      <IoAddOutline className="w-5 h-5" />
      <span>Summarize</span>
    </PopoverButton>
  );
};

/**
 * FloatPopoverPanel
 * @param settings - The settings state
 * @returns The FloatPopoverPanel component
 */
interface FloatPopoverPanelProps {
  settings: SettingsState;
}

/**
 * FloatPopoverPanel
 * @param settings - The settings state
 * @returns The FloatPopoverPanel component
 */
export const FloatPopoverPanel: React.FC<FloatPopoverPanelProps> = ({ settings }) => {
  return (
    <PopoverPanel
      className={clsx('absolute mb-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-2 min-w-[200px] border border-zinc-200 dark:border-zinc-700')}
    >
      <div className="flex flex-col gap-1">
        {Object.entries(AIService).map(([_, service], index) => (
          <button
            key={index}
            onClick={() => {
              logger.debug(`Clicked ${service} button`);
            }}
            className={`
                flex items-center gap-2 px-3 py-2
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-100 dark:hover:bg-zinc-700
                rounded-md
                transition-colors duration-200
              `}
          >
            <ServiceIcon service={service} className="w-4 h-4" />
            <span>{service}</span>
          </button>
        ))}
      </div>
    </PopoverPanel>
  );
};

/**
 * FloatPanel
 * @returns The FloatPanel component
 */
interface FloatPanelProps {}

/**
 * FloatPanel
 * @returns The FloatPanel component
 */
export const FloatPanel: React.FC<FloatPanelProps> = ({}) => {
  const { isFloatPanelVisible, settings } = useContentContext();

  if (!isFloatPanelVisible || settings.floatButtonPosition === FloatPanelPosition.HIDE) return null;

  return (
    <Popover>
      {({ open }) => (
        <>
          <FloatPopoverButton settings={settings} />
          <FloatPopoverPanel settings={settings} />
        </>
      )}
    </Popover>
  );
};
