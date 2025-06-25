import clsx from 'clsx';
import { ListMinus } from 'lucide-react';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { IoClipboardOutline, IoReloadOutline, IoSettingsOutline } from 'react-icons/io5';

import { Divider, ServiceIcon } from '@/components';
import { useContentContext } from '@/features/content/contexts';
import { useWindowSize } from '@/features/content/hooks';
import { AIService, FloatPanelPosition, getAIServiceLabel, MessageAction } from '@/types';
import { logger, sendMessageToServiceWorker } from '@/utils';

/**
 * FloatPanel
 * @returns The FloatPanel component
 */
export const FloatPanel: React.FC = () => {
  const { shouldShowFloatUI, settings, currentTabId, currentTabUrl } = useContentContext();
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const panelPositionClasses = useMemo(
    () =>
      clsx(
        settings.floatPanelPosition === FloatPanelPosition.TOP_LEFT && '!top-4 !left-4',
        settings.floatPanelPosition === FloatPanelPosition.TOP_CENTER && '!top-4 !left-1/2 -translate-x-1/2',
        settings.floatPanelPosition === FloatPanelPosition.TOP_RIGHT && '!top-4 !right-4',
        settings.floatPanelPosition === FloatPanelPosition.MIDDLE_LEFT && '!left-4 !top-1/2 -translate-y-1/2',
        settings.floatPanelPosition === FloatPanelPosition.MIDDLE_RIGHT && '!right-4 !top-1/2 -translate-y-1/2',
        settings.floatPanelPosition === FloatPanelPosition.BOTTOM_LEFT && '!bottom-4 !left-4',
        settings.floatPanelPosition === FloatPanelPosition.BOTTOM_CENTER && '!bottom-4 !left-1/2 -translate-x-1/2',
        settings.floatPanelPosition === FloatPanelPosition.BOTTOM_RIGHT && '!bottom-4 !right-4'
      ),
    [settings, isPanelVisible, shouldShowFloatUI, currentTabId, currentTabUrl, windowWidth, windowHeight]
  );

  const handleServiceWorkerMessage = async (message: any) => {
    if (currentTabId === null || currentTabUrl === null) {
      throw new Error('No active tab found');
    }

    try {
      setIsLoading(true);
      await sendMessageToServiceWorker(message);
      logger.debug('🫳💬', '[FloatPanel.tsx]', 'Message sent successfully');
    } catch (error) {
      logger.error('🫳💬', '[FloatPanel.tsx]', 'Failed to send message after retries:', error);

      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('Extension context invalidated')) {
        // Service worker is invalidated, suggest reloading the extension
        logger.warn('🫳💬', '[FloatPanel.tsx]', 'Service worker context invalidated, extension may need to be reloaded');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    shouldShowFloatUI && (
      <>
        <button
          ref={buttonRef}
          onMouseEnter={() => setIsPanelVisible(true)}
          className={clsx(
            'fixed z-[777777777777]',
            'flex items-center justify-center',
            'rounded-full',
            'p-[12px]',
            'bg-white/50 dark:bg-zinc-900/50',
            'text-zinc-900 dark:text-zinc-100',
            'font-semibold',
            'shadow-[0_0_24px_rgba(0,0,0,0.1)] dark:shadow-[0_0_24px_rgba(0,0,0,0.4)]',
            'transition-all duration-500 ease-in-out',
            'will-change-transform transform-gpu subpixel-antialiased',
            !shouldShowFloatUI || isPanelVisible ? 'opacity-0 scale-95 invisible' : 'opacity-100 scale-100 visible',
            panelPositionClasses
          )}
          style={{
            backdropFilter: 'blur(16px) invert(0.2)',
          }}
        >
          <ListMinus className="w-[16px] h-[16px]" />
        </button>
        <div
          ref={panelRef}
          className={clsx(
            'fixed z-[777777777777]',
            'text-[12px]',
            'rounded-[8px]',
            'p-[6px] min-w-[140px]',
            'bg-white/50 dark:bg-zinc-900/50',
            'shadow-[0_0_24px_rgba(0,0,0,0.1)] dark:shadow-[0_0_24px_rgba(0,0,0,0.4)]',
            'transition-all duration-200 ease-in-out',
            'will-change-transform transform-gpu subpixel-antialiased',
            isPanelVisible ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible',
            panelPositionClasses
          )}
          style={{
            backdropFilter: 'blur(16px) invert(0.2)',
          }}
        >
          <div className="flex flex-col gap-[6px]">
            {Object.entries(AIService)
              .filter(([_, service]) => settings.serviceOnMenu[service])
              .map(([name, service], index) => (
                <button
                  key={index}
                  onClick={async () => {
                    logger.debug('🫳💬', '[FloatPanel.tsx]', `Clicked ${name} button`);
                    await handleServiceWorkerMessage({
                      action: MessageAction.OPEN_AI_SERVICE,
                      payload: {
                        service: service,
                        tabId: currentTabId,
                        tabUrl: currentTabUrl,
                      },
                    });
                    setIsPanelVisible(false);
                  }}
                  disabled={isLoading}
                  className={clsx(
                    `
                    flex items-center gap-[8px] p-[6px]
                    text-[12px]
                    text-zinc-900 dark:text-zinc-100
                    hover:bg-zinc-400/80 dark:hover:bg-zinc-500/80
                    rounded-[4px]
                    transition-colors duration-200
                  `,
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <ServiceIcon service={service} className="w-[16px] h-[16px]" />
                  <span>{getAIServiceLabel(service)}</span>
                </button>
              ))}

            {/* Divider */}
            <div className="px-[4px]">
              <Divider />
            </div>

            {/* Copy to clipboard */}
            <button
              onClick={async () => {
                await handleServiceWorkerMessage({
                  action: MessageAction.READ_ARTICLE_FOR_CLIPBOARD,
                  payload: { tabId: currentTabId, tabUrl: currentTabUrl },
                });
                setIsPanelVisible(false);
              }}
              disabled={isLoading}
              className={clsx(
                `
                flex items-center gap-[8px] p-[6px]
                text-[12px]
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-400/80 dark:hover:bg-zinc-500/80
                rounded-[4px]
                transition-colors duration-200
              `,
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <IoClipboardOutline className="w-[16px] h-[16px]" />
              <span>Copy to clipboard</span>
            </button>

            {/* Extract article again */}
            <button
              onClick={async () => {
                logger.debug('📦🍿', '[FloatPanel.tsx]', '[render]', 'Extract article again');
                await handleServiceWorkerMessage({
                  action: MessageAction.EXTRACT_ARTICLE,
                  payload: { tabId: currentTabId, tabUrl: currentTabUrl },
                });
                setIsPanelVisible(false);
              }}
              disabled={isLoading}
              className={clsx(
                `
                flex items-center gap-[8px] p-[6px]
                text-[12px]
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-400/80 dark:hover:bg-zinc-500/80
                rounded-[4px]
                transition-colors duration-200
              `,
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <IoReloadOutline className="w-[16px] h-[16px]" />
              <span>Extract article again</span>
            </button>

            {/* Divider */}
            <div className="px-[4px]">
              <Divider />
            </div>

            {/* Settings */}
            <button
              onClick={async () => {
                logger.debug('📦🍿', '[FloatPanel.tsx]', '[render]', 'Settings clicked');
                await handleServiceWorkerMessage({
                  action: MessageAction.OPEN_SETTINGS,
                  payload: { tabId: currentTabId, tabUrl: currentTabUrl },
                });
                setIsPanelVisible(false);
              }}
              disabled={isLoading}
              className={clsx(
                `
                flex items-center gap-[8px] p-[6px]
                text-[12px]
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-400/80 dark:hover:bg-zinc-500/80
                rounded-[4px]
                transition-colors duration-200
              `,
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <IoSettingsOutline className="w-[16px] h-[16px]" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </>
    )
  );
};
