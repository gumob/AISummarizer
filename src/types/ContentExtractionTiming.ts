export enum ContentExtractionTiming {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

export const getContentExtractionTimingLabel = (method: ContentExtractionTiming): string => {
  const labels: Record<ContentExtractionTiming, string> = {
    [ContentExtractionTiming.AUTOMATIC]: 'On Tab Activation',
    [ContentExtractionTiming.MANUAL]: 'By User Action',
  };
  return labels[method];
};

export const getContentExtractionTimingIndex = (method: ContentExtractionTiming): number => {
  return Object.values(ContentExtractionTiming).findIndex(value => value === method);
};

export const getContentExtractionTimingFromIndex = (index: number): ContentExtractionTiming => {
  return Object.values(ContentExtractionTiming)[index];
};

export const getContentExtractionTimingTypeFromString = (str: string): ContentExtractionTiming => {
  switch (str) {
    case 'AUTOMATIC':
      return ContentExtractionTiming.AUTOMATIC;
    case 'MANUAL':
      return ContentExtractionTiming.MANUAL;
    default:
      return ContentExtractionTiming.AUTOMATIC;
  }
};
