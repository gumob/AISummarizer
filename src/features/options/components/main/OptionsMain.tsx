import React, {
  useEffect,
  useState,
} from 'react';

import clsx from 'clsx';
import { IoClose } from 'react-icons/io5';

import { chromeAPI } from '@/api';
import {
  OptionCard,
  OptionSwitchCard,
} from '@/features/options/components/main';
import { useGlobalContext } from '@/stores';
import {
  AIService,
  ContentExtractionMethod,
  FloatButtonPosition,
  getAIServiceLabel,
  getContentExtractionMethodLabel,
  getFloatButtonPositionLabel,
  getTabBehaviorLabel,
} from '@/types';
import { TabBehavior } from '@/types/TabBahavior';
import { logger } from '@/utils';

import { OptionTabCard } from './OptionTabCard';

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
        <OptionTabCard
          title="Prompt"
          selectedIndex={selectedPromptIndex}
          onChange={setSelectedPromptIndex}
          onSelect={setSelectedPromptIndex}
          options={AIService}
          getLabel={getAIServiceLabel}
        />
        <OptionTabCard
          title="Open AI Service in"
          selectedIndex={selectedTabBehaviorIndex}
          onChange={setSelectedTabBehaviorIndex}
          onSelect={setSelectedTabBehaviorIndex}
          options={TabBehavior}
          getLabel={getTabBehaviorLabel}
        />
        <OptionTabCard
          title="Float Button"
          selectedIndex={selectedFloatButtonIndex}
          onChange={setSelectedFloatButtonIndex}
          onSelect={setSelectedFloatButtonIndex}
          options={FloatButtonPosition}
          getLabel={getFloatButtonPositionLabel}
        />
        <OptionTabCard
          title="Content Extraction"
          selectedIndex={selectedContentExtractionMethodIndex}
          onChange={setSelectedContentExtractionMethodIndex}
          onSelect={setSelectedContentExtractionMethodIndex}
          options={ContentExtractionMethod}
          getLabel={getContentExtractionMethodLabel}
        />
        <OptionSwitchCard title="Show Message when Article is Extracted" checked={enableShowMessage ?? false} onChange={setEnableShowMessage} />
        <OptionSwitchCard title="Show Badge when Article is Extracted" checked={enableShowBadge ?? false} onChange={setEnableShowBadge} />
        <OptionSwitchCard title="Copy Article on Clipboard" checked={enableSaveArticleOnClipboard ?? false} onChange={setEnableSaveArticleOnClipboard} />
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
