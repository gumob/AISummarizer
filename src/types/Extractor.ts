export interface ExtractionResult {
  title: string | null;
  lang: string | null;
  textContent: string | null;
  isExtracted: boolean;
}
export interface Extractor {
  extract(): ExtractionResult;
}
