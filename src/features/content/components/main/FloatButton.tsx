import React from 'react';

import clsx from 'clsx';
import { IoAddOutline } from 'react-icons/io5';

import { ServiceIcon } from '@/components/ServiceIcon';
import { useContentContext } from '@/features/content/contexts';
import {
  AIService,
  FloatButtonPosition,
} from '@/types';
import { logger } from '@/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';

interface FloatButtonProps {}

export const FloatButton: React.FC<FloatButtonProps> = ({}) => {
  const { isFloatButtonVisible, settings } = useContentContext();

  if (!isFloatButtonVisible || settings.floatButtonPosition === FloatButtonPosition.HIDE) return null;

  return (
    <Popover
      className={clsx(
        'fixed z-[777777777777] flex items-center justify-center',
        settings.floatButtonPosition === FloatButtonPosition.TOP_LEFT && '!top-4 !left-4',
        settings.floatButtonPosition === FloatButtonPosition.TOP_CENTER && '!top-4 !left-1/2 -translate-x-1/2',
        settings.floatButtonPosition === FloatButtonPosition.TOP_RIGHT && '!top-4 !right-4',
        settings.floatButtonPosition === FloatButtonPosition.MIDDLE_LEFT && '!left-4 !top-1/2 -translate-y-1/2',
        settings.floatButtonPosition === FloatButtonPosition.MIDDLE_RIGHT && '!right-4 !top-1/2 -translate-y-1/2',
        settings.floatButtonPosition === FloatButtonPosition.BOTTOM_LEFT && '!bottom-4 !left-4',
        settings.floatButtonPosition === FloatButtonPosition.BOTTOM_CENTER && '!bottom-4 !left-1/2 -translate-x-1/2',
        settings.floatButtonPosition === FloatButtonPosition.BOTTOM_RIGHT && '!bottom-4 !right-4'
      )}
    >
      {({ open }) => (
        <>
          <PopoverButton
            className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full
                bg-blue-600 hover:bg-blue-700
                text-white shadow-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                dark:focus:ring-offset-zinc-900
              `}
          >
            <IoAddOutline className="w-5 h-5" />
            <span>Summarize</span>
          </PopoverButton>

          <PopoverPanel
            className={`
                absolute bottom-full right-0 mb-2
                bg-white dark:bg-zinc-800
                rounded-lg shadow-lg
                p-2 min-w-[200px]
                border border-zinc-200 dark:border-zinc-700
              `}
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
        </>
      )}
    </Popover>
  );
};
