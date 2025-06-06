export enum AIService {
  CHATGPT = 'CHATGPT',
  GEMINI = 'GEMINI',
  CLAUDE = 'CLAUDE',
  GROK = 'GROK',
  PERPLEXITY = 'PERPLEXITY',
  DEEPSEEK = 'DEEPSEEK',
}

export const getAIServiceFromId = (id: string): AIService => {
  switch (id) {
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
