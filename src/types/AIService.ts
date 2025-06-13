export const AI_SERVICE_QUERY_KEY = 'aismid';

export enum AIService {
  CHATGPT = 'CHATGPT',
  GEMINI = 'GEMINI',
  AI_STUDIO = 'AI_STUDIO',
  CLAUDE = 'CLAUDE',
  GROK = 'GROK',
  PERPLEXITY = 'PERPLEXITY',
  DEEPSEEK = 'DEEPSEEK',
}

export const getSummarizeUrl = (service: AIService, summarizeId: string) => {
  switch (service) {
    case AIService.CHATGPT:
      return `https://chatgpt.com/?${AI_SERVICE_QUERY_KEY}=${summarizeId}`;
    case AIService.GEMINI:
      return `https://gemini.google.com/app?${AI_SERVICE_QUERY_KEY}=${summarizeId}`;
    case AIService.AI_STUDIO:
      return `https://aistudio.google.com/prompts/new_chat?${AI_SERVICE_QUERY_KEY}=${summarizeId}`;
    case AIService.CLAUDE:
      return `https://claude.ai/new?${AI_SERVICE_QUERY_KEY}=${summarizeId}`;
    case AIService.GROK:
      return `https://grok.com/?${AI_SERVICE_QUERY_KEY}=${summarizeId}`;
    case AIService.PERPLEXITY:
      return `https://www.perplexity.ai/?${AI_SERVICE_QUERY_KEY}=${summarizeId}`;
    case AIService.DEEPSEEK:
      return `https://chat.deepseek.com/?${AI_SERVICE_QUERY_KEY}=${summarizeId}`;
  }
};

export const getAIServiceForUrl = (url: string): AIService => {
  if (/^https?:\/\/(?:www\.)?(chatgpt\.com)/.test(url)) {
    return AIService.CHATGPT;
  } else if (/^https?:\/\/(?:www\.)?(gemini\.google\.com)/.test(url)) {
    return AIService.GEMINI;
  } else if (/^https?:\/\/(?:www\.)?(aistudio\.google\.com)/.test(url)) {
    return AIService.AI_STUDIO;
  } else if (/^https?:\/\/(?:www\.)?((claude\.com)|(claude\.ai))/.test(url)) {
    return AIService.CLAUDE;
  } else if (/^https?:\/\/(?:www\.)?(grok\.com)/.test(url)) {
    return AIService.GROK;
  } else if (/^https?:\/\/(?:www\.)?(perplexity\.ai)/.test(url)) {
    return AIService.PERPLEXITY;
  } else if (/^https?:\/\/(?:www|chat\.)?(deepseek\.com)/.test(url)) {
    return AIService.DEEPSEEK;
  } else {
    throw new Error(`Invalid AI service URL: ${url}`);
  }
};

export const getAIServiceFromString = (id: string): AIService => {
  switch (id.toLowerCase()) {
    case 'chatgpt':
      return AIService.CHATGPT;
    case 'gemini':
      return AIService.GEMINI;
    case 'aistudio':
      return AIService.AI_STUDIO;
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
    case AIService.AI_STUDIO:
      return 'AI Studio';
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
