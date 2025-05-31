import React from 'react';

import {
  IoClipboardOutline,
  IoSettingsOutline,
} from 'react-icons/io5';

import { chromeAPI } from '@/api';
import {
  Divider,
  ServiceIcon,
} from '@/components';
import { ServiceListMenu } from '@/features/popup/components/main';
import { AIService } from '@/types';
import { logger } from '@/utils';

/**
 * The component for managing extensions.
 * @returns
 */
export const PopupMain: React.FC = () => {
  /**
   * The main component.
   * @returns
   */
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <div className="container mx-auto h-full flex flex-col items-start gap-1 px-2 pt-2">
        <ServiceListMenu>Summarize this page</ServiceListMenu>
        {Object.entries(AIService).map(([_, service], index) => (
          <ServiceListMenu
            key={index}
            onClick={() => {
              logger.debug(service);
              window.close();
            }}
          >
            <ServiceIcon service={service} className="w-4 h-4 translate-y-[2px] " />
            {service}
          </ServiceListMenu>
        ))}
        <Divider />
        <ServiceListMenu
          onClick={() => {
            logger.debug('Copy to clipboard');
            window.close();
          }}
        >
          <IoClipboardOutline className="w-4 h-4" />
          Copy to clipboard
        </ServiceListMenu>
        <Divider />
        <ServiceListMenu
          onClick={async () => {
            logger.debug('Settings clicked');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
              chromeAPI.openSidePanel(tab.windowId);
              window.close();
            }
          }}
        >
          <IoSettingsOutline className="w-4 h-4" />
          Settings
        </ServiceListMenu>
      </div>
    </main>
  );
};
