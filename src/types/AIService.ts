export enum AIService {
  CHATGPT = 'CHATGPT',
  GEMINI = 'GEMINI',
  CLAUDE = 'CLAUDE',
  GROK = 'GROK',
  PERPLEXITY = 'PERPLEXITY',
  DEEPSEEK = 'DEEPSEEK',
}

export const getSummarizeUrl = (service: AIService, summarizeId: string) => {
  switch (service) {
    case AIService.CHATGPT:
      return `https://chatgpt.com/?smid=${summarizeId}`;
    case AIService.GEMINI:
      return `https://gemini.com/?smid=${summarizeId}`;
    case AIService.CLAUDE:
      return `https://claude.com/?smid=${summarizeId}`;
    case AIService.GROK:
      return `https://grok.com/?smid=${summarizeId}`;
    case AIService.PERPLEXITY:
      return `https://perplexity.com/?smid=${summarizeId}`;
    case AIService.DEEPSEEK:
      return `https://deepseek.com/?smid=${summarizeId}`;
  }
};

export const getAIServiceFromString = (id: string): AIService => {
  switch (id.toLowerCase()) {
    case 'chatgpt':
      return AIService.CHATGPT;
    case 'gemini':
      return AIService.GEMINI;
    case 'claude':
      return AIService.CLAUDE;
    case 'grok':
      return AIService.GROK;
    case 'perplexity':
      return AIService.PERPLEXITY;
    case 'deepseek':
      return AIService.DEEPSEEK;
    default:
      throw new Error(`Invalid AI service ID: ${id}`);
  }
};

export const getAIServiceLabel = (service: AIService): string => {
  switch (service) {
    case AIService.CHATGPT:
      return 'ChatGPT';
    case AIService.GEMINI:
      return 'Gemini';
    case AIService.CLAUDE:
      return 'Claude';
    case AIService.GROK:
      return 'Grok';
    case AIService.PERPLEXITY:
      return 'Perplexity';
    case AIService.DEEPSEEK:
      return 'DeepSeek';
  }
};
