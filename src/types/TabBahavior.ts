export enum TabBehavior {
  CURRENT_TAB = 'CURRENT_TAB',
  NEW_TAB = 'NEW_TAB',
  NEW_PRIVATE_TAB = 'NEW_PRIVATE_TAB',
  NEW_INCOGNITO_TAB = 'NEW_INCOGNITO_TAB',
}

export const getTabBehaviorLabel = (behavior: TabBehavior): string => {
  const labels: Record<TabBehavior, string> = {
    [TabBehavior.CURRENT_TAB]: 'Current Tab',
    [TabBehavior.NEW_TAB]: 'New Tab',
    [TabBehavior.NEW_PRIVATE_TAB]: 'New Private Tab',
    [TabBehavior.NEW_INCOGNITO_TAB]: 'New Incognito Tab',
  };
  return labels[behavior];
};
