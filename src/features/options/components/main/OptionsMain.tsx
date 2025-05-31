import clsx from 'clsx';

import React, { useState } from 'react';

import { IoClose } from 'react-icons/io5';

import { Field, Tab, TabGroup, TabList, TabPanel, TabPanels, Textarea } from '@headlessui/react';

import { chromeAPI } from '@/api';
import { OptionCard } from '@/features/options/components/main';
import { AIService, FloatButtonPosition } from '@/types';
import { TabBehavior } from '@/types/TabBahavior';
import { logger } from '@/utils';

/**
 * The main component for the options page.
 * @returns
 */
export const OptionsMain: React.FC = () => {
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [selectedTabBehaviorIndex, setSelectedTabBehaviorIndex] = useState(0);
  const [selectedFloatButtonIndex, setSelectedFloatButtonIndex] = useState(0);

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
          <TabGroup selectedIndex={selectedPromptIndex} onChange={setSelectedPromptIndex}>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(AIService).map(([name, service], index) => (
                <Tab
                  key={name}
                  className={clsx(
                    'rounded-full px-3 py-1 font-semibold',
                    'text-zinc-900 dark:text-zinc-50',
                    'bg-zinc-300 dark:bg-zinc-700',
                    'opacity-30 dark:opacity-30',
                    'hover:opacity-100',
                    selectedPromptIndex === index && '!opacity-100',
                    'focus:outline-none',
                    'transition-opacity'
                  )}
                >
                  {service}
                </Tab>
              ))}
            </TabList>
            <TabPanels className="mt-3">
              {Object.entries(AIService).map(([name, service]) => (
                <TabPanel key={name} className="">
                  <Field>
                    <Textarea
                      name="prompt"
                      className={clsx(
                        'block w-full rounded-lg border-none',
                        'px-3 py-1.5 text-base/6',
                        'text-zinc-700 dark:text-zinc-300',
                        'bg-zinc-200 dark:bg-zinc-800',
                        'focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700'
                      )}
                      rows={10}
                      defaultValue={`Prompt for ${service}`}
                    />
                  </Field>
                </TabPanel>
              ))}
            </TabPanels>
          </TabGroup>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tab Behavior</h2>
          <TabGroup selectedIndex={selectedTabBehaviorIndex} onChange={setSelectedTabBehaviorIndex}>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(TabBehavior).map(([name, service], index) => (
                <Tab
                  key={name}
                  className={clsx(
                    'rounded-full px-3 py-1 font-semibold',
                    'text-zinc-900 dark:text-zinc-50',
                    'bg-zinc-300 dark:bg-zinc-700',
                    'opacity-30 dark:opacity-30',
                    'hover:opacity-100',
                    selectedTabBehaviorIndex === index && '!opacity-100',
                    'focus:outline-none',
                    'transition-opacity'
                  )}
                >
                  {service}
                </Tab>
              ))}
            </TabList>
          </TabGroup>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Float Button</h2>
          <TabGroup selectedIndex={selectedFloatButtonIndex} onChange={setSelectedFloatButtonIndex}>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(FloatButtonPosition).map(([name, service], index) => (
                <Tab
                  key={name}
                  className={clsx(
                    'rounded-full px-3 py-1 font-semibold',
                    'text-zinc-900 dark:text-zinc-50',
                    'bg-zinc-300 dark:bg-zinc-700',
                    'opacity-30 dark:opacity-30',
                    'hover:opacity-100',
                    selectedFloatButtonIndex === index && '!opacity-100',
                    'focus:outline-none',
                    'transition-opacity'
                  )}
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
