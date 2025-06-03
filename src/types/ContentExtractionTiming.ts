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
