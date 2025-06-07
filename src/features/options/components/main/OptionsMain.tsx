import React, {
  Fragment,
  useEffect,
  useState,
} from 'react';

import clsx from 'clsx';
import { IoClose } from 'react-icons/io5';

import { OptionCard } from '@/features/options/components/main';
import {
  useArticleStore,
  useGlobalContext,
} from '@/stores';
import {
  AIService,
  ContentExtractionTiming,
  FloatPanelPosition,
  getContentExtractionTimingLabel,
  getFloatButtonPositionLabel,
  getTabBehaviorLabel,
} from '@/types';
import { TabBehavior } from '@/types/TabBahavior';
import {
  escapeRegExpArray,
  logger,
} from '@/utils';
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
    contentExtractionTiming,
    setContentExtractionTiming,
    extractionDenylist,
    setExtractionDenylist,
    isShowMessage,
    setIsShowMessage,
    isShowBadge,
    setIsShowBadge,
    saveArticleOnClipboard,
    setSaveArticleOnClipboard,
  } = useGlobalContext();

  const { cleanup: cleanupDatabase } = useArticleStore();

  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [selectedTabBehaviorIndex, setSelectedTabBehaviorIndex] = useState(-1);
  const [selectedFloatButtonIndex, setSelectedFloatButtonIndex] = useState(-1);
  const [selectedContentExtractionTimingIndex, setSelectedContentExtractionTimingIndex] = useState(-1);
  const [enableShowMessage, setEnableShowMessage] = useState<boolean | null>(null);
  const [enableShowBadge, setEnableShowBadge] = useState<boolean | null>(null);
  const [enableSaveArticleOnClipboard, setEnableSaveArticleOnClipboard] = useState<boolean | null>(null);
  const [promptValues, setPromptValues] = useState<{ [key in AIService]?: string }>({});
  const [extractionDenylistValue, setExtractionDenylistValue] = useState<string | null>(null);

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

  /** Set FloatPanelPosition index */
  useEffect(() => {
    const floatButtonIndex = Object.values(FloatPanelPosition).findIndex(value => value === floatButtonPosition);
    if (floatButtonIndex !== -1) {
      setSelectedFloatButtonIndex(floatButtonIndex);
    }
  }, [floatButtonPosition]);

  /** Set PageExtractionMethod index */
  useEffect(() => {
    const contentExtractionTimingIndex = Object.values(ContentExtractionTiming).findIndex(value => value === contentExtractionTiming);
    if (contentExtractionTimingIndex !== -1) {
      setSelectedContentExtractionTimingIndex(contentExtractionTimingIndex);
    }
  }, [contentExtractionTiming]);

  /** Set ExtractionDenylist */
  useEffect(() => {
    if (extractionDenylistValue !== null) setExtractionDenylist(extractionDenylistValue.split('\n').filter(value => value.trim() !== ''));
  }, [extractionDenylist]);

  /** Set ShowMessage index */
  useEffect(() => {
    if (enableShowMessage !== null) setIsShowMessage(enableShowMessage);
    logger.debug('📦⌥', 'enableShowMessage', enableShowMessage);
  }, [enableShowMessage]);

  useEffect(() => {
    if (enableShowMessage === null) setEnableShowMessage(isShowMessage);
    logger.debug('📦⌥', 'isShowMessage', isShowMessage);
  }, [isShowMessage]);

  /** Set ShowBadge index */
  useEffect(() => {
    if (enableShowBadge !== null) setIsShowBadge(enableShowBadge);
    logger.debug('📦⌥', 'enableShowBadge', enableShowBadge);
  }, [enableShowBadge]);

  useEffect(() => {
    if (enableShowBadge === null) setEnableShowBadge(isShowBadge);
    logger.debug('📦⌥', 'isShowBadge', isShowBadge);
  }, [isShowBadge]);

  /** Set SaveArticleOnClipboard index */
  useEffect(() => {
    if (enableSaveArticleOnClipboard !== null) setSaveArticleOnClipboard(enableSaveArticleOnClipboard);
    logger.debug('📦⌥', 'enableSaveArticleOnClipboard', enableSaveArticleOnClipboard);
  }, [enableSaveArticleOnClipboard]);

  useEffect(() => {
    if (enableSaveArticleOnClipboard === null) setEnableSaveArticleOnClipboard(saveArticleOnClipboard);
    logger.debug('📦⌥', 'saveArticleOnClipboard', saveArticleOnClipboard);
  }, [saveArticleOnClipboard]);

  useEffect(() => {
    const loadPrompts = async () => {
      const values = await Promise.all(Object.values(AIService).map(async service => [service, await prompt(service)] as const));
      setPromptValues(Object.fromEntries(values));
    };
    loadPrompts();
  }, [prompt]);

  /*******************************************************
   * Render
   *******************************************************/

  return (
    <div className="min-h-screen p-4 bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
          <button
            onClick={async () => {
              try {
                await chrome.sidePanel.setOptions({ enabled: false });
              } catch (error) {
                logger.error('📦⌥', 'Failed to close side panel', error);
              }
            }}
            className="rounded-full p-2 text-lg text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>
        <OptionCard title="Prompt">
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
                        'block w-full rounded-lg',
                        'px-3 py-1.5 text-base/6',
                        'text-zinc-700 dark:text-zinc-300',
                        'bg-zinc-50 dark:bg-zinc-800',
                        'border border-zinc-300 dark:border-none',
                        'focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700'
                      )}
                      rows={12}
                      value={promptValues[service] ?? ''}
                      onChange={e => setPrompt(service, e.target.value)}
                    />
                  </Field>
                </TabPanel>
              ))}
            </TabPanels>
          </TabGroup>
        </OptionCard>
        <OptionCard title="Open AI Service in">
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
        <OptionCard title="Float Button">
          <TabGroup selectedIndex={selectedFloatButtonIndex} onChange={setSelectedFloatButtonIndex}>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(FloatPanelPosition).map(([name, position]: [string, FloatPanelPosition], index) => (
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
        <OptionCard title="Content Extraction">
          <TabGroup selectedIndex={selectedContentExtractionTimingIndex} onChange={setSelectedContentExtractionTimingIndex}>
            <TabList className="flex flex-wrap gap-2">
              {Object.entries(ContentExtractionTiming).map(([name, method]: [string, ContentExtractionTiming], index) => (
                <Tab
                  key={name}
                  className={clsx(
                    'rounded-full px-3 py-1 font-semibold',
                    'text-zinc-900 dark:text-zinc-50',
                    'bg-zinc-300 dark:bg-zinc-700',
                    'opacity-30 dark:opacity-30',
                    'hover:opacity-100',
                    selectedContentExtractionTimingIndex === index && '!opacity-100',
                    'focus:outline-none',
                    'transition-opacity'
                  )}
                  onClick={() => setContentExtractionTiming(method)}
                >
                  {getContentExtractionTimingLabel(method)}
                </Tab>
              ))}
            </TabList>
          </TabGroup>
        </OptionCard>
        {contentExtractionTiming === ContentExtractionTiming.AUTOMATIC && (
          <OptionCard title="Denylist">
            <Textarea
              name="denylist"
              className={`
                block w-full
                rounded-lg
                px-3 py-1.5
                text-base/6
                text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-none
                focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700
              `}
              rows={12}
              value={extractionDenylistValue ?? ''}
              onChange={e => setExtractionDenylist(escapeRegExpArray(e.target.value.split('\n').filter(value => value.trim() !== '')))}
            />
          </OptionCard>
        )}
        <OptionCard title="Copy Article on Clipboard">
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
                <span className={clsx('size-4 rounded-full transition', 'bg-white', checked ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            )}
          </Switch>
        </OptionCard>
        <OptionCard title="Show Message when Article is Extracted">
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
                <span className={clsx('size-4 rounded-full transition', 'bg-white', checked ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            )}
          </Switch>
        </OptionCard>
        <OptionCard title="Show Badge when Article is Extracted">
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
                <span className={clsx('size-4 rounded-full transition', 'bg-white', checked ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            )}
          </Switch>
        </OptionCard>
        <OptionCard title="Cache">
          <button
            className={clsx(
              'rounded-full px-6 py-4 text-lg font-semibold',
              'text-zinc-900 dark:text-zinc-50',
              'bg-zinc-300 dark:bg-zinc-700',
              'focus:outline-none',
              'transition-opacity'
            )}
            onClick={async () => {
              try {
                await cleanupDatabase();
                logger.debug('📦⌥', 'Database cleanup completed');
              } catch (error) {
                logger.error('📦⌥', 'Failed to cleanup database:', error);
              }
            }}
          >
            Delete Cache on Database
          </button>
        </OptionCard>
      </div>
    </div>
  );
};
