import React from 'react';

import { IoClose } from 'react-icons/io5';

import { chromeAPI } from '@/api';
import { OptionCard } from '@/features/options/components/main';
import {
  AIService,
  FloatButtonPosition,
} from '@/types';
import { TabBehavior } from '@/types/TabBahavior';
import { logger } from '@/utils';
import {
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@headlessui/react';

/**
 * The main component for the options page.
 * @returns
 */
export const OptionsMain: React.FC = () => {
  return (
    <div className="min-h-screen p-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
          <button
            onClick={async () => {
              try {
                await chromeAPI.closeSidePanel();
              } catch (error) {
                logger.error('Failed to close side panel', error);
              }
            }}
            className="rounded-full p-2 text-lg text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Prompt</h2>
          <TabGroup>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(AIService).map(([name, service]) => (
                <Tab
                  key={name}
                  className="rounded-full px-3 py-1 text-sm/6 font-semibold text-zinc-900 dark:text-zinc-50
                  bg-zinc-300 dark:bg-zinc-700
                  focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white data-hover:bg-white/5
                  data-selected:bg-white/10 data-selected:data-hover:bg-white/10"
                >
                  {service}
                </Tab>
              ))}
            </TabList>
            <TabPanels className="mt-3">
              {Object.entries(AIService).map(([name, service]) => (
                <TabPanel key={name} className="rounded-xl bg-zinc-300 dark:bg-zinc-700 p-3">
                  <ul>
                    <p>Prompt for {service}</p>
                  </ul>
                </TabPanel>
              ))}
            </TabPanels>
          </TabGroup>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tab Behavior</h2>
          <TabGroup>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(TabBehavior).map(([name, service]) => (
                <Tab
                  key={name}
                  className="rounded-full px-3 py-1 text-sm/6 font-semibold text-zinc-900 dark:text-zinc-50
                bg-zinc-300 dark:bg-zinc-700
                focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white data-hover:bg-white/5
                data-selected:bg-white/10 data-selected:data-hover:bg-white/10"
                >
                  {service}
                </Tab>
              ))}
            </TabList>
          </TabGroup>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Float Button</h2>
          <TabGroup>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(FloatButtonPosition).map(([name, service]) => (
                <Tab
                  key={name}
                  className="rounded-full px-3 py-1 text-sm/6 font-semibold text-zinc-900 dark:text-zinc-50
                bg-zinc-300 dark:bg-zinc-700
                focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white data-hover:bg-white/5
                data-selected:bg-white/10 data-selected:data-hover:bg-white/10"
                >
                  {service}
                </Tab>
              ))}
            </TabList>
          </TabGroup>
        </OptionCard>
      </div>
    </div>
  );
};
