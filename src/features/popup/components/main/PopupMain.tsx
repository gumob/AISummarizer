import React, {
  useEffect,
  useState,
} from 'react';

import {
  IoClipboardOutline,
  IoReloadOutline,
  IoSettingsOutline,
} from 'react-icons/io5';

import {
  Divider,
  ServiceIcon,
} from '@/components';
import { ServiceListMenu } from '@/features/popup/components/main';
import { useGlobalContext } from '@/stores';
import {
  AIService,
  getAIServiceLabel,
  MessageAction,
} from '@/types';
import {
  isInvalidUrl,
  logger,
} from '@/utils';

/**
 * The component for managing extensions.
 * @returns
 */
export const PopupMain: React.FC = () => {
  const [shouldShowFullMenu, setShouldShowFullMenu] = useState(false);
  const { serviceOnMenu } = useGlobalContext();

  useEffect(() => {
    const init = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id || !tab.url) {
        setShouldShowFullMenu(false);
      } else {
        const isAvailable: boolean = !(await isInvalidUrl(tab.url));
        setShouldShowFullMenu(isAvailable);
      }
    };
    init();
    return () => {
      setShouldShowFullMenu(false);
    };
  }, []);

  useEffect(() => {
    logger.debug('📦🍿', '[PopupMain.tsx]', '[useEffect]', 'shouldShowFullMenu', shouldShowFullMenu);
    if (shouldShowFullMenu) {
      document.body.classList.add('popup-full-menu');
      document.body.classList.remove('popup-minimal-menu');
    } else {
      document.body.classList.add('popup-minimal-menu');
      document.body.classList.remove('popup-full-menu');
    }
  }, [shouldShowFullMenu]);

  /**
   * The main component.
   * @returns
   */
  return (
    (shouldShowFullMenu && (
      <main className="h-screen flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
        <div className="container mx-auto h-full flex flex-col items-start gap-1 px-2 pt-2">
          <ServiceListMenu>Summarize this page</ServiceListMenu>
          {Object.entries(AIService)
            .filter(([_, service]) => serviceOnMenu[service])
            .map(([_, service], index) => (
              <ServiceListMenu
                key={index}
                onClick={async () => {
                  logger.debug('📦🍿', '[PopupMain.tsx]', '[render]', 'service', service);
                  /** Check if the content script is injected */
                  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                  if (!tab.id || !tab.url) throw new Error('No active tab found');

                  /** Send the message to the content script */
                  await chrome.runtime.sendMessage({
                    action: MessageAction.OPEN_AI_SERVICE,
                    payload: {
                      service: service,
                      tabId: tab.id,
                      tabUrl: tab.url!,
                    },
                  });

                  /** Close the popup */
                  window.close();
                }}
              >
                <ServiceIcon service={service} className="w-4 h-4 translate-y-[2px] " />
                {getAIServiceLabel(service)}
              </ServiceListMenu>
            ))}
          <Divider />
          <ServiceListMenu
            onClick={async () => {
              logger.debug('📦🍿', '[PopupMain.tsx]', '[render]', 'Copy to clipboard');
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (!tab.id || !tab.url) throw new Error('No active tab found');
              await chrome.runtime.sendMessage({
                action: MessageAction.READ_ARTICLE_FOR_CLIPBOARD,
                payload: { tabId: tab.id, tabUrl: tab.url },
              });

              /** Close the popup */
              window.close();
            }}
          >
            <IoClipboardOutline className="w-4 h-4" />
            Copy to clipboard
          </ServiceListMenu>
          <ServiceListMenu
            onClick={async () => {
              logger.debug('📦🍿', '[PopupMain.tsx]', '[render]', 'Extract article again');
              /** Check if the content script is injected */
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (!tab.id || !tab.url) throw new Error('No active tab found');

              /** Send the message to the content script */
              await chrome.tabs.sendMessage(tab.id, {
                action: MessageAction.EXTRACT_ARTICLE,
                payload: { tabId: tab.id, tabUrl: tab.url },
              });

              /** Close the popup */
              window.close();
            }}
          >
            <IoReloadOutline className="w-4 h-4" />
            Extract article again
          </ServiceListMenu>
          <Divider />
          <ServiceListMenu
            onClick={async () => {
              logger.debug('📦🍿', '[PopupMain.tsx]', '[render]', 'Settings clicked');
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (tab?.id && tab?.windowId) {
                chrome.sidePanel.setOptions({ path: 'options.html', enabled: true });
                chrome.sidePanel.open({ windowId: tab.windowId });
                window.close();
              }
            }}
          >
            <IoSettingsOutline className="w-4 h-4" />
            Settings
          </ServiceListMenu>
        </div>
      </main>
    )) || (
      <main className="h-screen flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
        <div className="container mx-auto h-full flex flex-col items-start gap-1 px-2 pt-2">
          <ServiceListMenu>Not available on this page</ServiceListMenu>
          <Divider />
          <ServiceListMenu
            onClick={async () => {
              logger.debug('📦🍿', '[PopupMain.tsx]', '[render]', 'Settings clicked');
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (tab?.id && tab?.windowId) {
                chrome.sidePanel.setOptions({ path: 'options.html', enabled: true });
                chrome.sidePanel.open({ windowId: tab.windowId });

                /** Close the popup */
                window.close();
              }
            }}
          >
            <IoSettingsOutline className="w-4 h-4" />
            Settings
          </ServiceListMenu>
        </div>
      </main>
    )
  );
};
