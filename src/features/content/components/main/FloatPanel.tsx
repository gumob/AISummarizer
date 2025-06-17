import clsx from 'clsx';

import React, { useEffect, useRef, useState } from 'react';

import { IoAddOutline, IoClipboardOutline, IoReloadOutline, IoSettingsOutline } from 'react-icons/io5';

import { Divider, ServiceIcon } from '@/components';
import { useContentContext } from '@/features/content/contexts';
import { useWindowSize } from '@/features/content/hooks';
import { AIService, FloatPanelPosition, getAIServiceLabel, MessageAction } from '@/types';
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
  const { isFloatPanelVisible, settings, currentTabId, currentTabUrl } = useContentContext();
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { windowWidth, windowHeight } = useWindowSize();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsidePanel = panelRef.current?.contains(target);
      const isClickInsideButton = buttonRef.current?.contains(target);

      if (!isClickInsidePanel && !isClickInsideButton) {
        setIsPanelVisible(false);
      }
    };

    if (isPanelVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelVisible]);

  useEffect(() => {
    setIsPanelVisible(false);
  }, [settings.floatPanelPosition, windowWidth, windowHeight]);

  if (!isFloatPanelVisible || settings.floatPanelPosition === FloatPanelPosition.HIDE) return null;

  const panelPositionClasses = clsx(
    'fixed z-[777777777777]',
    settings.floatPanelPosition === FloatPanelPosition.TOP_LEFT && '!top-4 !left-4',
    settings.floatPanelPosition === FloatPanelPosition.TOP_CENTER && '!top-4 !left-1/2 -translate-x-1/2',
    settings.floatPanelPosition === FloatPanelPosition.TOP_RIGHT && '!top-4 !right-4',
    settings.floatPanelPosition === FloatPanelPosition.MIDDLE_LEFT && '!left-4 !top-1/2 -translate-y-1/2',
    settings.floatPanelPosition === FloatPanelPosition.MIDDLE_RIGHT && '!right-4 !top-1/2 -translate-y-1/2',
    settings.floatPanelPosition === FloatPanelPosition.BOTTOM_LEFT && '!bottom-4 !left-4',
    settings.floatPanelPosition === FloatPanelPosition.BOTTOM_CENTER && '!bottom-4 !left-1/2 -translate-x-1/2',
    settings.floatPanelPosition === FloatPanelPosition.BOTTOM_RIGHT && '!bottom-4 !right-4'
  );

  return (
    <>
      <div
        className={clsx(
          panelPositionClasses,
          'transition-all duration-200 ease-in-out',
          isPanelVisible ? 'opacity-0 scale-95 invisible' : 'opacity-100 scale-100 visible'
        )}
      >
        <button
          ref={buttonRef}
          onMouseEnter={() => setIsPanelVisible(true)}
          className={clsx(
            `
            flex items-center justify-center
            rounded-full
            p-[12px]
            bg-white/80 dark:bg-zinc-900/80
            text-zinc-900 dark:text-zinc-100
            font-semibold
            border border-white/10 dark:border-zinc-800/10
            shadow-[0_0_24px_rgba(0,0,0,0.1)] dark:shadow-[0_0_24px_rgba(0,0,0,0.4)]
            backdrop-blur-md
            dark:focus:ring-offset-zinc-900
            transition-colors duration-200
            focus:outline-none focus:ring-none
            `
          )}
        >
          <IoAddOutline className="w-[16px] h-[16px]" />
        </button>
      </div>
      <div
        ref={panelRef}
        className={clsx(
          panelPositionClasses,
          'transition-all duration-200 ease-in-out',
          isPanelVisible ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible',
          `
          text-[12px]
          rounded-[8px]
          p-[6px] min-w-[140px]
          backdrop-blur-md
          bg-white/80 dark:bg-zinc-900/80
          shadow-[0_0_24px_rgba(0,0,0,0.1)] dark:shadow-[0_0_24px_rgba(0,0,0,0.4)]
          border border-white/10 dark:border-zinc-800/10
          `
        )}
      >
        <div className="flex flex-col gap-[6px]">
          {Object.entries(AIService).map(([name, service], index) => (
            <button
              key={index}
              onClick={async () => {
                logger.debug('🫳💬', '[FloatPanel.tsx]', `Clicked ${name} button`);
                if (currentTabId === null || currentTabUrl === null) throw new Error('No active tab found');
                logger.debug('🫳💬', '[FloatPanel.tsx]', 'Sending message to service worker script', currentTabId, currentTabUrl);
                try {
                  await chrome.runtime.sendMessage({
                    action: MessageAction.OPEN_AI_SERVICE,
                    payload: {
                      service: service,
                      tabId: currentTabId,
                      tabUrl: currentTabUrl,
                    },
                  });
                  logger.debug('🫳💬', '[FloatPanel.tsx]', 'Message sent successfully');
                } catch (error) {
                  logger.error('🫳💬', '[FloatPanel.tsx]', 'Failed to send message:', error);
                }
                setIsPanelVisible(false);
              }}
              className={`
                flex items-center gap-[8px] p-[6px]
                text-[12px]
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-500/80 dark:hover:bg-zinc-500/80
                rounded-[4px]
                transition-colors duration-200
              `}
            >
              <ServiceIcon service={service} className="w-[16px] h-[16px]" />
              <span>{getAIServiceLabel(service)}</span>
            </button>
          ))}

          {/* Divider */}
          <Divider />

          {/* Copy to clipboard */}
          <button
            onClick={async () => {
              if (currentTabId === null || currentTabUrl === null) throw new Error('No active tab found');
              await chrome.runtime.sendMessage({
                action: MessageAction.READ_ARTICLE_FOR_CLIPBOARD,
                payload: { tabId: currentTabId, tabUrl: currentTabUrl },
              });
              setIsPanelVisible(false);
            }}
            className={`
                flex items-center gap-[8px] p-[6px]
                text-[12px]
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-500/80 dark:hover:bg-zinc-500/80
                rounded-[4px]
                transition-colors duration-200
              `}
          >
            <IoClipboardOutline className="w-[16px] h-[16px]" />
            <span>Copy to clipboard</span>
          </button>

          {/* Extract article again */}
          <button
            onClick={async () => {
              logger.debug('📦🍿', '[FloatPanel.tsx]', '[render]', 'Extract article again');
              await chrome.runtime.sendMessage({
                action: MessageAction.EXTRACT_ARTICLE,
                payload: { tabId: currentTabId, tabUrl: currentTabUrl },
              });
              setIsPanelVisible(false);
            }}
            className={`
                flex items-center gap-[8px] p-[6px]
                text-[12px]
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-500/80 dark:hover:bg-zinc-500/80
                rounded-[4px]
                transition-colors duration-200
              `}
          >
            <IoReloadOutline className="w-[16px] h-[16px]" />
            <span>Extract article again</span>
          </button>

          {/* Divider */}
          <Divider />

          {/* Settings */}
          <button
            onClick={async () => {
              logger.debug('📦🍿', '[FloatPanel.tsx]', '[render]', 'Settings clicked');
              if (currentTabId === null || currentTabUrl === null) throw new Error('No active tab found');
              await chrome.runtime.sendMessage({
                action: MessageAction.OPEN_SETTINGS,
                payload: { tabId: currentTabId, tabUrl: currentTabUrl },
              });
              setIsPanelVisible(false);
            }}
            className={`
                flex items-center gap-[8px] p-[6px]
                text-[12px]
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-500/80 dark:hover:bg-zinc-500/80
                rounded-[4px]
                transition-colors duration-200
              `}
          >
            <IoSettingsOutline className="w-[16px] h-[16px]" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};
