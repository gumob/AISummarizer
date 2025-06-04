import React, { useEffect } from 'react';

import { IoAddOutline } from 'react-icons/io5';

import { ServiceIcon } from '@/components/ServiceIcon';
import { AIService } from '@/types';
import { logger } from '@/utils';
import { Popover } from '@headlessui/react';

interface FloatButtonProps {
  isVisible: boolean;
}

export const FloatButton: React.FC<FloatButtonProps> = ({ isVisible }) => {
  useEffect(() => {
    logger.debug('🛟🛟', 'isVisible', isVisible);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
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
            </Popover.Button>

            <Popover.Panel
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
            </Popover.Panel>
          </>
        )}
      </Popover>
    </div>
  );
};
