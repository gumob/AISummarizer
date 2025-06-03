export enum AIService {
  CHATGPT = 'ChatGPT',
  GEMINI = 'Gemini',
  CLAUDE = 'Claude',
  GROK = 'Grok',
  PERPLEXITY = 'Perplexity',
  DEEPSEEK = 'DeepSeek',
}

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
