import React from 'react';

import { IoClose } from 'react-icons/io5';

import { chromeAPI } from '@/api';
import { Card } from '@/components';
import { logger } from '@/utils';

/**
 * The main component for the options page.
 * @returns
 */
export const OptionsMain: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
          <button
            onClick={async () => {
              logger.debug('Close side panel');
              try {
                await chromeAPI.closeSidePanel();
              } catch (error) {
                logger.error('Failed to close side panel', error);
              }
            }}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">General Settings</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Settings will be added here.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
