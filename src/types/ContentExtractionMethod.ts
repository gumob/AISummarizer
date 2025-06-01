export enum ContentExtractionMethod {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

export const getContentExtractionMethodLabel = (method: ContentExtractionMethod): string => {
  const labels: Record<ContentExtractionMethod, string> = {
    [ContentExtractionMethod.AUTOMATIC]: 'On Tab Activation',
    [ContentExtractionMethod.MANUAL]: 'By User Action',
  };
  return labels[method];
};
