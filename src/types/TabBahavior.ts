export enum TabBehavior {
  CURRENT_TAB = 'CURRENT_TAB',
  NEW_TAB = 'NEW_TAB',
  NEW_PRIVATE_TAB = 'NEW_PRIVATE_TAB',
  // NEW_INCOGNITO_TAB = 'NEW_INCOGNITO_TAB',
}

export const getTabBehaviorLabel = (behavior: TabBehavior): string => {
  const labels: Record<TabBehavior, string> = {
    [TabBehavior.CURRENT_TAB]: 'Current Tab',
    [TabBehavior.NEW_TAB]: 'New Tab',
    [TabBehavior.NEW_PRIVATE_TAB]: 'New Private Tab',
    // [TabBehavior.NEW_INCOGNITO_TAB]: 'New Incognito Tab',
  };
  return labels[behavior];
};

export const getTabBehaviorIndex = (behavior: TabBehavior): number => {
  return Object.values(TabBehavior).findIndex(value => value === behavior);
};

export const getTabBehaviorFromIndex = (index: number): TabBehavior => {
  return Object.values(TabBehavior)[index];
};

export const getTabBehaviorTypeFromString = (str: string): TabBehavior => {
  switch (str) {
    case 'CURRENT_TAB':
      return TabBehavior.CURRENT_TAB;
    case 'NEW_TAB':
      return TabBehavior.NEW_TAB;
    case 'NEW_PRIVATE_TAB':
      return TabBehavior.NEW_PRIVATE_TAB;
    default:
      return TabBehavior.CURRENT_TAB;
  }
};
