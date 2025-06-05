import clsx from 'clsx';

import React, { useMemo } from 'react';

import { IoAddOutline } from 'react-icons/io5';

import { autoPlacement, offset, useDismiss, useFloating } from '@floating-ui/react';
import { Popover, PopoverBackdrop, PopoverButton, PopoverPanel } from '@headlessui/react';

import { ServiceIcon } from '@/components/ServiceIcon';
import { useContentContext } from '@/features/content/contexts';
import { SettingsState } from '@/stores/SettingsStore';
import { AIService, FloatPanelPosition } from '@/types';
import { logger } from '@/utils';

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
      {({ open }) => (
        <>
          <PopoverBackdrop className="fixed inset-0 z-[777777777776]" />
          <PopoverButton
            ref={refs.setReference}
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
          <PopoverPanel
            ref={refs.setFloating}
            style={floatingStyles}
            className={clsx(
              'fixed z-[777777777777] bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-2 min-w-[200px] border border-zinc-200 dark:border-zinc-700'
            )}
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
