import React, {
  useEffect,
  useState,
} from 'react';

import clsx from 'clsx';
import { IoClose } from 'react-icons/io5';

import { chromeAPI } from '@/api';
import { OptionCard } from '@/features/options/components/main';
import { useGlobalContext } from '@/stores';
import {
  AIService,
  FloatButtonPosition,
  getFloatButtonPositionLabel,
  getTabBehaviorLabel,
} from '@/types';
import {
  ContentExtractionMethod,
  getContentExtractionMethodLabel,
} from '@/types/ContentExtractionMethod';
import { TabBehavior } from '@/types/TabBahavior';
import { logger } from '@/utils';
import {
  Field,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Textarea,
} from '@headlessui/react';

/**
 * The main component for the options page.
 * @returns
 */
export const OptionsMain: React.FC = () => {
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [selectedTabBehaviorIndex, setSelectedTabBehaviorIndex] = useState(-1);
  const [selectedFloatButtonIndex, setSelectedFloatButtonIndex] = useState(-1);
  const [selectedContentExtractionMethodIndex, setSelectedContentExtractionMethodIndex] = useState(-1);

  const { prompt, setPrompt, tabBehavior, setTabBehavior, floatButtonPosition, setFloatButtonPosition, contentExtractionMethod, setContentExtractionMethod } =
    useGlobalContext();

  // Initialize selected indices based on stored values
  useEffect(() => {
    // Set TabBehavior index
    const tabBehaviorIndex = Object.values(TabBehavior).findIndex(value => value === tabBehavior);
    if (tabBehaviorIndex !== -1) {
      setSelectedTabBehaviorIndex(tabBehaviorIndex);
    }

    // Set FloatButtonPosition index
    const floatButtonIndex = Object.values(FloatButtonPosition).findIndex(value => value === floatButtonPosition);
    if (floatButtonIndex !== -1) {
      setSelectedFloatButtonIndex(floatButtonIndex);
    }

    // Set PageExtractionMethod index
    const contentExtractionMethodIndex = Object.values(ContentExtractionMethod).findIndex(value => value === contentExtractionMethod);
    if (contentExtractionMethodIndex !== -1) {
      setSelectedContentExtractionMethodIndex(contentExtractionMethodIndex);
    }
  }, [tabBehavior, floatButtonPosition, contentExtractionMethod]);

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
              {Object.entries(AIService).map(([name, service]: [string, AIService], index) => (
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
              {Object.entries(AIService).map(([name, service]: [string, AIService]) => (
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
                      rows={12}
                      value={prompt(service)}
                      onChange={e => setPrompt(service, e.target.value)}
                    />
                  </Field>
                </TabPanel>
              ))}
            </TabPanels>
          </TabGroup>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Open AI Service in</h2>
          <TabGroup selectedIndex={selectedTabBehaviorIndex} onChange={setSelectedTabBehaviorIndex}>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(TabBehavior).map(([name, behavior]: [string, TabBehavior], index) => (
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
                  onClick={() => setTabBehavior(behavior)}
                >
                  {getTabBehaviorLabel(behavior)}
                </Tab>
              ))}
            </TabList>
          </TabGroup>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Float Button</h2>
          <TabGroup selectedIndex={selectedFloatButtonIndex} onChange={setSelectedFloatButtonIndex}>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(FloatButtonPosition).map(([name, position]: [string, FloatButtonPosition], index) => (
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
                  onClick={() => setFloatButtonPosition(position)}
                >
                  {getFloatButtonPositionLabel(position)}
                </Tab>
              ))}
            </TabList>
          </TabGroup>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Content Extraction</h2>
          <TabGroup selectedIndex={selectedContentExtractionMethodIndex} onChange={setSelectedContentExtractionMethodIndex}>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(ContentExtractionMethod).map(([name, method]: [string, ContentExtractionMethod], index) => (
                <Tab
                  key={name}
                  className={clsx(
                    'rounded-full px-3 py-1 font-semibold',
                    'text-zinc-900 dark:text-zinc-50',
                    'bg-zinc-300 dark:bg-zinc-700',
                    'opacity-30 dark:opacity-30',
                    'hover:opacity-100',
                    selectedContentExtractionMethodIndex === index && '!opacity-100',
                    'focus:outline-none',
                    'transition-opacity'
                  )}
                  onClick={() => setContentExtractionMethod(method)}
                >
                  {getContentExtractionMethodLabel(method)}
                </Tab>
              ))}
            </TabList>
          </TabGroup>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Cache</h2>
          <button
            className={clsx(
              'rounded-full px-6 py-4 text-lg font-semibold',
              'text-zinc-900 dark:text-zinc-50',
              'bg-zinc-300 dark:bg-zinc-700',
              'focus:outline-none',
              'transition-opacity'
            )}
            onClick={() => {}}
          >
            Delete Cache on Database
          </button>
        </OptionCard>
      </div>
    </div>
  );
};
