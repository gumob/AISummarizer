import React, {
  Fragment,
  useCallback,
  useEffect,
  useState,
} from 'react';

import clsx from 'clsx';
import { IoClose } from 'react-icons/io5';

import {
  toast,
  Toaster,
} from '@/features/content/components/main/Toaster';
import {
  ConfirmDialog,
  OptionCard,
} from '@/features/options/components/main';
import { useGlobalContext } from '@/stores';
import {
  AIService,
  ContentExtractionTiming,
  FloatPanelPosition,
  getContentExtractionTimingFromIndex,
  getContentExtractionTimingIndex,
  getContentExtractionTimingLabel,
  getFloatPanelPositionFromIndex,
  getFloatPanelPositionIndex,
  getFloatPanelPositionLabel,
  getTabBehaviorFromIndex,
  getTabBehaviorIndex,
  getTabBehaviorLabel,
  TabBehavior,
} from '@/types';
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
    promptFor: storedPromptFor,
    setPromptFor: setStoredPromptFor,
    tabBehavior: storedTabBehavior,
    setTabBehavior: setStoredTabBehavior,
    floatPanelPosition: storedFloatPanelPosition,
    setFloatPanelPosition: setStoredFloatPanelPosition,
    contentExtractionTiming: storedContentExtractionTiming,
    setContentExtractionTiming: setStoredContentExtractionTiming,
    extractionDenylist: storedExtractionDenylist,
    setExtractionDenylist: setStoredExtractionDenylist,
    saveArticleOnClipboard: storedSaveArticleOnClipboard,
    setSaveArticleOnClipboard: setStoredSaveArticleOnClipboard,
    isShowMessage: storedIsShowMessage,
    setIsShowMessage: setStoredIsShowMessage,
    isShowBadge: storedIsShowBadge,
    setIsShowBadge: setStoredIsShowBadge,
    exportSettings,
    importSettings,
    restoreSettings,
    resetDatabase,
  } = useGlobalContext();

  const [localPromptIndex, setLocalPromptIndex] = useState<number>(0);
  const [localPrompt, setLocalPrompt] = useState<{ [key in AIService]?: string } | undefined>(undefined);

  const [localTabBehavior, setLocalTabBehavior] = useState<number | undefined>(undefined);
  const [localFloatPanel, setLocalFloatPanel] = useState<number | undefined>(undefined);
  const [localContentExtractionTiming, setLocalContentExtractionTiming] = useState<number | undefined>(undefined);
  const [localIsSaveArticleOnClipboard, setLocalIsSaveArticleOnClipboard] = useState<boolean | undefined>(undefined);
  const [localIsShowMessage, setLocalIsShowMessage] = useState<boolean | undefined>(undefined);
  const [localIsShowBadge, setLocalIsShowBadge] = useState<boolean | undefined>(undefined);

  const [localExtractionDenylist, setLocalExtractionDenylist] = useState<string | undefined>(undefined);

  const [isDeleteCacheDialogOpen, setIsDeleteCacheDialogOpen] = useState<boolean>(false);
  const [isResetSettingsDialogOpen, setIsResetSettingsDialogOpen] = useState<boolean>(false);

  /*******************************************************
   * Initialize selected indices based on stored values
   *******************************************************/

  /**
   * TODO: 設定の読み込み、レストアをしてもUIに反映されない。
   * TODO: `localIsShowBadge === null`のように、nullの場合のみ更新しているのが原因。
   * TODO: ユーザーインプットとデータの更新が競合しないようにuseEffectの使用方法を見直す。
   */
  useEffect(() => {
    const loadPrompts = async () => {
      const values: [AIService, string][] = await Promise.all(
        Object.values(AIService).map(async service => [service, await storedPromptFor(service)] as const)
      );
      setLocalPrompt(Object.fromEntries(values));
    };
    if (localPrompt === undefined && storedPromptFor !== undefined) loadPrompts();
  }, [storedPromptFor]);

  useEffect(() => {
    if (localTabBehavior === undefined) setLocalTabBehavior(getTabBehaviorIndex(storedTabBehavior));
  }, [storedTabBehavior]);

  useEffect(() => {
    if (localFloatPanel === undefined) setLocalFloatPanel(getFloatPanelPositionIndex(storedFloatPanelPosition));
  }, [storedFloatPanelPosition]);

  useEffect(() => {
    if (localContentExtractionTiming === undefined) setLocalContentExtractionTiming(getContentExtractionTimingIndex(storedContentExtractionTiming));
  }, [storedContentExtractionTiming]);

  useEffect(() => {
    if (localExtractionDenylist === undefined) setLocalExtractionDenylist(storedExtractionDenylist?.join('\n'));
  }, [storedExtractionDenylist]);

  /**
   * IsSaveArticleOnClipboard
   */
  useEffect(() => {
    logger.debug('📦⌥', '[OptionsMain.tsx]', '[useEffect]', 'storedSaveArticleOnClipboard:', storedSaveArticleOnClipboard);
    if (localIsSaveArticleOnClipboard === undefined) setLocalIsSaveArticleOnClipboard(storedSaveArticleOnClipboard);
  }, [storedSaveArticleOnClipboard]);

  // useEffect(() => {
  //   logger.debug('📦⌥', '[OptionsMain.tsx]', '[useEffect]', 'localIsSaveArticleOnClipboard:', localIsSaveArticleOnClipboard);
  //   setStoredSaveArticleOnClipboard(localIsSaveArticleOnClipboard ?? false);
  // }, [localIsSaveArticleOnClipboard]);

  /**
   * IsShowMessage
   */
  useEffect(() => {
    logger.debug('📦⌥', '[OptionsMain.tsx]', '[useEffect]', 'storedIsShowMessage:', storedIsShowMessage);
    if (localIsShowMessage === undefined) setLocalIsShowMessage(storedIsShowMessage);
  }, [storedIsShowMessage]);

  // useEffect(() => {
  //   logger.debug('📦⌥', '[OptionsMain.tsx]', '[useEffect]', 'localIsShowMessage:', localIsShowMessage);
  //   setStoredIsShowMessage(localIsShowMessage ?? false);
  // }, [localIsShowMessage]);

  /**
   * IsShowBadge
   */
  useEffect(() => {
    logger.debug('📦⌥', '[OptionsMain.tsx]', '[useEffect]', 'storedIsShowBadge:', storedIsShowBadge);
    if (localIsShowBadge === undefined) setLocalIsShowBadge(storedIsShowBadge);
  }, [storedIsShowBadge]);

  // useEffect(() => {
  //   logger.debug('📦⌥', '[OptionsMain.tsx]', '[useEffect]', 'localIsShowBadge:', localIsShowBadge);
  //   setStoredIsShowBadge(localIsShowBadge ?? false);
  // }, [localIsShowBadge]);

  /*******************************************************
   * Handlers
   *******************************************************/

  /**
   * Save Settings
   */
  const saveStoredSettings = useCallback(async () => {
    Object.entries(AIService).forEach(async ([name, service]) => {
      await setStoredPromptFor(service, localPrompt?.[service] ?? '');
    });
    await setStoredTabBehavior(getTabBehaviorFromIndex(localTabBehavior ?? 0));
    await setStoredFloatPanelPosition(getFloatPanelPositionFromIndex(localFloatPanel ?? 0));
    await setStoredContentExtractionTiming(getContentExtractionTimingFromIndex(localContentExtractionTiming ?? 0));
    await setStoredSaveArticleOnClipboard(localIsSaveArticleOnClipboard ?? false);
    await setStoredIsShowMessage(localIsShowMessage ?? false);
    await setStoredIsShowBadge(localIsShowBadge ?? false);
    await setStoredExtractionDenylist(localExtractionDenylist?.split('\n') ?? []);
  }, [localPrompt, localTabBehavior, localFloatPanel, localContentExtractionTiming, localIsSaveArticleOnClipboard]);

  const unsetLocalSettings = useCallback(() => {
    setLocalPromptIndex(0);
    setLocalPrompt(undefined);
    setLocalTabBehavior(undefined);
    setLocalFloatPanel(undefined);
    setLocalContentExtractionTiming(undefined);
    setLocalExtractionDenylist(undefined);
    setLocalIsSaveArticleOnClipboard(undefined);
    setLocalIsShowMessage(undefined);
    setLocalIsShowBadge(undefined);
  }, []);

  /**
   * Export Settings
   */
  const handleExport = useCallback(async () => {
    const result = await exportSettings();
    if (result.success) toast.success('Settings exported successfully');
    else toast.error(result.error?.message ?? 'Failed to export settings');
  }, [exportSettings]);

  /**
   * Import Settings
   */
  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      /** Get the file */
      const file = event.target.files?.[0];
      if (!file) return;

      /** Unset local settings */
      unsetLocalSettings();

      /** Import the settings */
      const result = await importSettings(file);
      if (result.success) toast.success('Settings imported successfully');
      else toast.error(result.error?.message ?? 'Failed to import settings');
    },
    [importSettings, unsetLocalSettings]
  );

  /**
   * Restore Default Settings
   */
  const handleResetSettings = useCallback(async () => {
    /** Unset local settings */
    unsetLocalSettings();

    /** Restore settings */
    const result = await restoreSettings();
    if (result.success) toast.success('Settings restored successfully');
    else toast.error(result.error?.message ?? 'Failed to restore settings');
  }, [restoreSettings, unsetLocalSettings]);

  /**
   * Clear Article Cache
   */
  const handleDeleteCache = useCallback(async () => {
    /** Unset local settings */
    unsetLocalSettings();

    /** Reset database */
    const result = await resetDatabase();
    if (result.success) toast.success('Database cleanup completed');
    else toast.error(result.error?.message ?? 'Failed to cleanup database');
  }, [resetDatabase, unsetLocalSettings]);

  /*******************************************************
   * Render
   *******************************************************/

  return (
    <>
      <Toaster position="top-center" duration={3000} />
      <div className="min-h-screen p-4 bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 ps-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
            <button
              onClick={async () => {
                try {
                  await chrome.sidePanel.setOptions({ enabled: false });
                } catch (error) {
                  logger.error('📦⌥', '[OptionsMain.tsx]', '[render]', 'Failed to close side panel', error);
                }
              }}
              className="rounded-full p-2 text-lg text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <IoClose className="h-6 w-6" />
            </button>
          </div>

          {/* Prompt */}
          <OptionCard title="Prompt">
            <TabGroup selectedIndex={localPromptIndex} onChange={setLocalPromptIndex}>
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
                      localPromptIndex === index && '!opacity-100',
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
                        value={localPrompt?.[service] ?? ''}
                        onChange={async e => await setStoredPromptFor(service, e.target.value)}
                      />
                    </Field>
                  </TabPanel>
                ))}
              </TabPanels>
            </TabGroup>
          </OptionCard>

          {/* Open AI Service in */}
          <OptionCard title="Open AI Service in">
            <TabGroup selectedIndex={localTabBehavior} onChange={setLocalTabBehavior}>
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
                      localTabBehavior === index && '!opacity-100',
                      'focus:outline-none',
                      'transition-opacity'
                    )}
                    onClick={async () => await setStoredTabBehavior(behavior)}
                  >
                    {getTabBehaviorLabel(behavior)}
                  </Tab>
                ))}
              </TabList>
            </TabGroup>
          </OptionCard>

          {/* Float Panel */}
          <OptionCard title="Float Button Position">
            <TabGroup selectedIndex={localFloatPanel} onChange={setLocalFloatPanel}>
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
                      localFloatPanel === index && '!opacity-100',
                      'focus:outline-none',
                      'transition-opacity'
                    )}
                    onClick={async () => await setStoredFloatPanelPosition(position)}
                  >
                    {getFloatPanelPositionLabel(position)}
                  </Tab>
                ))}
              </TabList>
            </TabGroup>
          </OptionCard>

          {/* Content Extraction */}
          <OptionCard title="Content Extraction">
            <TabGroup selectedIndex={localContentExtractionTiming} onChange={setLocalContentExtractionTiming}>
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
                      localContentExtractionTiming === index && '!opacity-100',
                      'focus:outline-none',
                      'transition-opacity'
                    )}
                    onClick={async () => await setStoredContentExtractionTiming(method)}
                  >
                    {getContentExtractionTimingLabel(method)}
                  </Tab>
                ))}
              </TabList>
            </TabGroup>
          </OptionCard>
          {storedContentExtractionTiming === ContentExtractionTiming.AUTOMATIC && (
            <div className="p-2">
              <h3 className="mb-4 text-default font-semibold text-zinc-900 dark:text-zinc-100">Denylist</h3>
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
                value={localExtractionDenylist}
                onChange={e => {
                  const newValue = e.target.value;
                  setLocalExtractionDenylist(newValue);
                  const filteredLines = newValue.split('\n');
                  setStoredExtractionDenylist(filteredLines);
                }}
              />
            </div>
          )}

          {/* Copy Article on Clipboard */}
          <OptionCard title="Copy Article on Clipboard">
            <Switch checked={localIsSaveArticleOnClipboard ?? false} onChange={setLocalIsSaveArticleOnClipboard} as={Fragment}>
              {({ checked, disabled }) => (
                <button
                  className={clsx(
                    'group inline-flex h-6 w-11 items-center rounded-full',
                    checked ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                  onClick={async () => await setStoredSaveArticleOnClipboard(!checked)}
                >
                  <span className="sr-only">Copy Article on Clipboard</span>
                  <span className={clsx('size-4 rounded-full transition', 'bg-white', checked ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              )}
            </Switch>
          </OptionCard>

          {/* Show Message when Article is Extracted */}
          <OptionCard title="Show Message when Article is Extracted">
            <Switch checked={localIsShowMessage ?? false} onChange={setLocalIsShowMessage} as={Fragment}>
              {({ checked, disabled }) => (
                <button
                  className={clsx(
                    'group inline-flex h-6 w-11 items-center rounded-full',
                    checked ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                  onClick={async () => await setStoredIsShowMessage(!checked)}
                >
                  <span className="sr-only">Show Message when Article is Extracted</span>
                  <span className={clsx('size-4 rounded-full transition', 'bg-white', checked ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              )}
            </Switch>
          </OptionCard>

          {/* Show Badge when Article is Extracted */}
          <OptionCard title="Show Badge when Article is Extracted">
            <Switch checked={localIsShowBadge ?? false} onChange={setLocalIsShowBadge} as={Fragment}>
              {({ checked, disabled }) => (
                <button
                  className={clsx(
                    'group inline-flex h-6 w-11 items-center rounded-full',
                    checked ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                  onClick={async () => await setStoredIsShowBadge(!checked)}
                >
                  <span className="sr-only">Show Message when Article is Extracted</span>
                  <span className={clsx('size-4 rounded-full transition', 'bg-white', checked ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              )}
            </Switch>
          </OptionCard>

          {/* Manage Settings */}
          <OptionCard title="Manage Settings" className="flex flex-col gap-2">
            <button
              className={clsx(
                'rounded-full max-w-60 px-6 py-4 text-lg',
                'font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors',
                'focus:outline-none whitespace-nowrap'
              )}
              onClick={handleExport}
            >
              Export Settings
            </button>
            <div className="relative">
              <input type="file" accept=".json" onChange={handleImport} className="hidden" id="import-settings" />
              <label
                htmlFor="import-settings"
                className={clsx(
                  'rounded-full max-w-60 px-6 py-4 text-lg',
                  'font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors',
                  'focus:outline-none whitespace-nowrap',
                  'cursor-pointer block text-center'
                )}
              >
                Import Settings
              </label>
            </div>
            <button
              className={clsx(
                'rounded-full max-w-60 px-6 py-4 text-lg',
                'font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors',
                'focus:outline-none whitespace-nowrap'
              )}
              onClick={() => setIsResetSettingsDialogOpen(true)}
            >
              Restore Default Settings
            </button>
          </OptionCard>
          <OptionCard title="Manage Cache" className="flex flex-col gap-2">
            <button
              className={`
              rounded-full max-w-60 px-6 py-4 text-lg
              font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors
              focus:outline-none whitespace-nowrap
            `}
              onClick={() => setIsDeleteCacheDialogOpen(true)}
            >
              Clear Article Cache
            </button>
          </OptionCard>
        </div>

        {/* Reset Settings Dialog */}
        <ConfirmDialog
          isOpen={isResetSettingsDialogOpen}
          onClose={() => setIsResetSettingsDialogOpen(false)}
          title="Restore Default Settings"
          description="Are you sure you want to restore default settings?"
          confirmText="Restore"
          onConfirm={async () => {
            await handleResetSettings();
            setIsResetSettingsDialogOpen(false);
          }}
        />

        {/* Delete Cache Dialog */}
        <ConfirmDialog
          isOpen={isDeleteCacheDialogOpen}
          onClose={() => setIsDeleteCacheDialogOpen(false)}
          title="Clear Article Cache"
          description="Are you sure you want to clear all cached articles?"
          confirmText="Clear"
          onConfirm={async () => {
            await handleDeleteCache();
            setIsDeleteCacheDialogOpen(false);
          }}
        />
      </div>
    </>
  );
};
