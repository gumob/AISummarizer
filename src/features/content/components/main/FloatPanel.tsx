import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import clsx from 'clsx';
import { IoAddOutline } from 'react-icons/io5';

import { ServiceIcon } from '@/components';
import { useContentContext } from '@/features/content/contexts';
import { useWindowSize } from '@/features/content/hooks';
import {
  AIService,
  FloatPanelPosition,
  getAIServiceLabel,
  MessageAction,
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
  const { isFloatPanelVisible, settings, tabId, tabUrl } = useContentContext();
  const [isHovered, setIsHovered] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLElement | null>(null);
  const { windowWidth, windowHeight } = useWindowSize();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsHovered(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isHovered) {
      setIsHovered(false);
    }
  }, [settings.floatPanelPosition]);

  useEffect(() => {
    setIsHovered(false);
  }, [windowWidth, windowHeight]);

  const placement = useMemo(() => {
    switch (settings.floatPanelPosition) {
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
  }, [settings.floatPanelPosition]);

  const { refs, floatingStyles, context } = useFloating({
    placement: placement,
    strategy: 'fixed',
    middleware: [offset(10)],
  });

  if (!isFloatPanelVisible || settings.floatPanelPosition === FloatPanelPosition.HIDE) return null;

  return (
    <Popover>
      {({ open, close }) => (
        <>
          <PopoverBackdrop className="fixed inset-0 z-[777777777776]" />
          <PopoverButton
            ref={el => {
              refs.setReference(el);
              buttonRef.current = el;
            }}
            onMouseEnter={() => setIsHovered(true)}
            className={clsx(
              `
              fixed z-[777777777777]
              flex items-center justify-center
              rounded-full
              gap-1 ps-4 pe-4 py-4
              bg-white/80 dark:bg-zinc-900/80
              text-zinc-900 dark:text-zinc-100
              font-semibold
              border border-white/10 dark:border-zinc-800/10
              shadow-[0_0_24px_rgba(0,0,0,0.1)] dark:shadow-[0_0_24px_rgba(0,0,0,0.4)]
              backdrop-blur-md
              dark:focus:ring-offset-zinc-900
              transition-colors duration-200
              focus:outline-none focus:ring-none
              `,
              settings.floatPanelPosition === FloatPanelPosition.TOP_LEFT && '!top-4 !left-4',
              settings.floatPanelPosition === FloatPanelPosition.TOP_CENTER && '!top-4 !left-1/2 -translate-x-1/2',
              settings.floatPanelPosition === FloatPanelPosition.TOP_RIGHT && '!top-4 !right-4',
              settings.floatPanelPosition === FloatPanelPosition.MIDDLE_LEFT && '!left-4 !top-1/2 -translate-y-1/2',
              settings.floatPanelPosition === FloatPanelPosition.MIDDLE_RIGHT && '!right-4 !top-1/2 -translate-y-1/2',
              settings.floatPanelPosition === FloatPanelPosition.BOTTOM_LEFT && '!bottom-4 !left-4',
              settings.floatPanelPosition === FloatPanelPosition.BOTTOM_CENTER && '!bottom-4 !left-1/2 -translate-x-1/2',
              settings.floatPanelPosition === FloatPanelPosition.BOTTOM_RIGHT && '!bottom-4 !right-4'
            )}
          >
            <IoAddOutline className="w-5 h-5" />
          </PopoverButton>
          <Transition
            show={isHovered}
            enter="transition-opacity duration-100 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-60 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <PopoverPanel
              ref={el => {
                refs.setFloating(el);
                panelRef.current = el;
              }}
              style={floatingStyles}
              className={clsx(
                'fixed z-[777777777777]',
                'bg-white/80 dark:bg-zinc-900/80',
                'backdrop-blur-md',
                'rounded-lg',
                'shadow-[0_0_24px_rgba(0,0,0,0.1)] dark:shadow-[0_0_24px_rgba(0,0,0,0.4)]',
                'p-2 min-w-[180px]',
                'border border-white/10 dark:border-zinc-800/10'
              )}
            >
              <div className="flex flex-col gap-1">
                {Object.entries(AIService).map(([name, service], index) => (
                  <button
                    key={index}
                    onClick={async () => {
                      logger.debug('🫳💬', '[FloatPanel.tsx]', `Clicked ${name} button`);
                      if (tabId === null || tabUrl === null) throw new Error('No active tab found');
                      logger.debug('🫳💬', '[FloatPanel.tsx]', 'Sending message to service worker script', tabId, tabUrl);
                      try {
                        await chrome.runtime.sendMessage({
                          action: MessageAction.SUMMARIZE_ARTICLE_START,
                          payload: {
                            service: service,
                            tabId: tabId,
                            url: tabUrl,
                          },
                        });
                        logger.debug('🫳💬', '[FloatPanel.tsx]', 'Message sent successfully');
                      } catch (error) {
                        logger.error('🫳💬', '[FloatPanel.tsx]', 'Failed to send message:', error);
                      }
                      setIsHovered(false);
                      close();
                    }}
                    className={`
                      flex items-center gap-2 px-2 py-2
                      text-zinc-900 dark:text-zinc-100
                      hover:bg-zinc-500/20 dark:hover:bg-zinc-500/20
                      rounded-md
                      transition-colors duration-200
                    `}
                  >
                    <ServiceIcon service={service} className="w-5 h-5" />
                    <span>{getAIServiceLabel(service)}</span>
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
