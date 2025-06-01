export interface ExtractionResult {
  title: string | null;
  content: string | null;
  isExtracted: boolean;
}
export interface Extractor {
  extract(): ExtractionResult;
}
