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
