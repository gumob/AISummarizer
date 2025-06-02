import React, {
  Fragment,
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
  ContentExtractionMethod,
  FloatButtonPosition,
  getContentExtractionMethodLabel,
  getFloatButtonPositionLabel,
  getTabBehaviorLabel,
} from '@/types';
import { TabBehavior } from '@/types/TabBahavior';
import { logger } from '@/utils';
import {
  Field,
  Switch,
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
  /*******************************************************
   * State
   *******************************************************/

  const {
    prompt,
    setPrompt,
    tabBehavior,
    setTabBehavior,
    floatButtonPosition,
    setFloatButtonPosition,
    contentExtractionMethod,
    setContentExtractionMethod,
    isShowMessage,
    setIsShowMessage,
    isShowBadge,
    setIsShowBadge,
    saveArticleOnClipboard,
    setSaveArticleOnClipboard,
  } = useGlobalContext();

  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [selectedTabBehaviorIndex, setSelectedTabBehaviorIndex] = useState(-1);
  const [selectedFloatButtonIndex, setSelectedFloatButtonIndex] = useState(-1);
  const [selectedContentExtractionMethodIndex, setSelectedContentExtractionMethodIndex] = useState(-1);
  const [enableShowMessage, setEnableShowMessage] = useState<boolean | null>(null);
  const [enableShowBadge, setEnableShowBadge] = useState<boolean | null>(null);
  const [enableSaveArticleOnClipboard, setEnableSaveArticleOnClipboard] = useState<boolean | null>(null);

  /*******************************************************
   * Initialize selected indices based on stored values
   *******************************************************/

  /** Set TabBehavior index */
  useEffect(() => {
    const tabBehaviorIndex = Object.values(TabBehavior).findIndex(value => value === tabBehavior);
    if (tabBehaviorIndex !== -1) {
      setSelectedTabBehaviorIndex(tabBehaviorIndex);
    }
  }, [tabBehavior]);

  /** Set FloatButtonPosition index */
  useEffect(() => {
    const floatButtonIndex = Object.values(FloatButtonPosition).findIndex(value => value === floatButtonPosition);
    if (floatButtonIndex !== -1) {
      setSelectedFloatButtonIndex(floatButtonIndex);
    }
  }, [floatButtonPosition]);

  /** Set PageExtractionMethod index */
  useEffect(() => {
    const contentExtractionMethodIndex = Object.values(ContentExtractionMethod).findIndex(value => value === contentExtractionMethod);
    if (contentExtractionMethodIndex !== -1) {
      setSelectedContentExtractionMethodIndex(contentExtractionMethodIndex);
    }
  }, [contentExtractionMethod]);

  /** Set ShowMessage index */
  useEffect(() => {
    if (enableShowMessage !== null) setIsShowMessage(enableShowMessage);
    logger.debug('enableShowMessage', enableShowMessage);
  }, [enableShowMessage]);

  useEffect(() => {
    if (enableShowMessage === null) setEnableShowMessage(isShowMessage);
    logger.debug('isShowMessage', isShowMessage);
  }, [isShowMessage]);

  /** Set ShowBadge index */
  useEffect(() => {
    if (enableShowBadge !== null) setIsShowBadge(enableShowBadge);
    logger.debug('enableShowBadge', enableShowBadge);
  }, [enableShowBadge]);

  useEffect(() => {
    if (enableShowBadge === null) setEnableShowBadge(isShowBadge);
    logger.debug('isShowBadge', isShowBadge);
  }, [isShowBadge]);

  /** Set SaveArticleOnClipboard index */
  useEffect(() => {
    if (enableSaveArticleOnClipboard !== null) setSaveArticleOnClipboard(enableSaveArticleOnClipboard);
    logger.debug('enableSaveArticleOnClipboard', enableSaveArticleOnClipboard);
  }, [enableSaveArticleOnClipboard]);

  useEffect(() => {
    if (enableSaveArticleOnClipboard === null) setEnableSaveArticleOnClipboard(saveArticleOnClipboard);
    logger.debug('saveArticleOnClipboard', saveArticleOnClipboard);
  }, [saveArticleOnClipboard]);

  /*******************************************************
   * Render
   *******************************************************/

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
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Show Message when Article is Extracted</h2>
          <Switch checked={enableShowMessage ?? false} onChange={setEnableShowMessage} as={Fragment}>
            {({ checked, disabled }) => (
              <button
                className={clsx(
                  'group inline-flex h-6 w-11 items-center rounded-full',
                  checked ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="sr-only">Show Message when Article is Extracted</span>
                <span className={clsx('size-4 rounded-full transition', 'bg-zinc-50', checked ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            )}
          </Switch>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Show Badge when Article is Extracted</h2>
          <Switch checked={enableShowBadge ?? false} onChange={setEnableShowBadge} as={Fragment}>
            {({ checked, disabled }) => (
              <button
                className={clsx(
                  'group inline-flex h-6 w-11 items-center rounded-full',
                  checked ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="sr-only">Show Message when Article is Extracted</span>
                <span className={clsx('size-4 rounded-full transition', 'bg-zinc-50', checked ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            )}
          </Switch>
        </OptionCard>
        <OptionCard>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Copy Article on Clipboard</h2>
          <Switch checked={enableSaveArticleOnClipboard ?? false} onChange={setEnableSaveArticleOnClipboard} as={Fragment}>
            {({ checked, disabled }) => (
              <button
                className={clsx(
                  'group inline-flex h-6 w-11 items-center rounded-full',
                  checked ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="sr-only">Copy Article on Clipboard</span>
                <span className={clsx('size-4 rounded-full transition', 'bg-zinc-50', checked ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            )}
          </Switch>
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
