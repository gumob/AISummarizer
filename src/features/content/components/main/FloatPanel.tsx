import React, { useMemo } from 'react';

import clsx from 'clsx';
import { IoAddOutline } from 'react-icons/io5';

import { ServiceIcon } from '@/components/ServiceIcon';
import { useContentContext } from '@/features/content/contexts';
import {
  AIService,
  FloatPanelPosition,
} from '@/types';
import { logger } from '@/utils';
import {
  offset,
  useFloating,
} from '@floating-ui/react';
import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';

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

  const placement = useMemo(() => {
    switch (settings.floatButtonPosition) {
      case FloatPanelPosition.TOP_LEFT:
        return `bottom-start`;
      case FloatPanelPosition.TOP_CENTER:
        return `bottom`;
      case FloatPanelPosition.TOP_RIGHT:
        return `bottom-end`;
      case FloatPanelPosition.MIDDLE_LEFT:
        return `right`;
      case FloatPanelPosition.MIDDLE_RIGHT:
        return `left`;
      case FloatPanelPosition.BOTTOM_LEFT:
        return `top-start`;
      case FloatPanelPosition.BOTTOM_CENTER:
        return `top`;
      case FloatPanelPosition.BOTTOM_RIGHT:
        return `top-end`;
      default:
        return `bottom`;
    }
  }, [settings.floatButtonPosition]);

  const { refs, floatingStyles, context } = useFloating({
    placement: placement,
    strategy: 'fixed',
    middleware: [offset(10)],
  });

  if (!isFloatPanelVisible || settings.floatButtonPosition === FloatPanelPosition.HIDE) return null;

  return (
    <Popover>
      {({ open, close }) => (
        <>
          <PopoverBackdrop className="fixed inset-0 z-[777777777776]" />
          <PopoverButton
            ref={refs.setReference}
            className={clsx(
              `
              fixed z-[777777777777]
              flex items-center justify-center
              gap-2 px-3 py-2 rounded-full
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold drop-shadow-lg
              dark:focus:ring-offset-zinc-900
              transition-color duration-200
              focus:outline-none focus:ring-none
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
          <Transition
            enter="transition-opacity transition-scale duration-100 ease-out"
            enterFrom="scale-80 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transition-opacity transition-scale duration-60 ease-in"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-80 opacity-0"
          >
            <PopoverPanel
              ref={refs.setFloating}
              style={floatingStyles}
              className={clsx(
                'fixed z-[777777777777]',
                'bg-white dark:bg-zinc-800',
                'rounded-lg shadow-lg p-2 min-w-[180px]',
                'border border-zinc-100 dark:border-zinc-800'
              )}
            >
              <div className="flex flex-col gap-1">
                {Object.entries(AIService).map(([_, service], index) => (
                  <button
                    key={index}
                    onClick={() => {
                      logger.debug(`Clicked ${service} button`);
                      close();
                    }}
                    className={`
                      flex items-center gap-2 px-2 py-2
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
          </Transition>
        </>
      )}
    </Popover>
  );
};
