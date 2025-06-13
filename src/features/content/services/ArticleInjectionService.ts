import { ArticleRecord } from '@/db/Database';
import { injectChatGPT } from '@/features/content/injectors';
import { ArticleInjectionResult } from '@/types';
import {
  isAIServiceUrl,
  logger,
} from '@/utils';

export class ArticleInjectionService {
  async execute(serviceUrl: string, article: ArticleRecord): Promise<ArticleInjectionResult> {
    logger.debug('🧑‍🍳📖', '[ArticleInjectionService.tsx]', '[execute]', 'Injecting...', '\nserviceUrl:', serviceUrl);

    /**
     * Skip processing for browser-specific URLs
     */
    if (!isAIServiceUrl(serviceUrl)) {
      logger.warn('🧑‍🍳📖', '[ArticleInjectionService.tsx]', '[execute]', 'Skipping injection for invalid URLs', serviceUrl);
      return {
        success: false,
        error: new Error('Skipping injection for invalid URLs'),
      };
    }

    /**
     * YouTube
     */
    if (/^https?:\/\/(?:www\.)?(chatgpt\.com)/.test(serviceUrl)) {
      logger.debug('🧑‍🍳📖', '[ArticleInjectionService.tsx]', '[execute]', 'Injecting article into ChatGPT');
      try {
        return await injectChatGPT(article);
      } catch (error: any) {
        logger.error('🧑‍🍳📖', '[ArticleInjectionService.tsx]', '[execute]', 'Failed to inject article into ChatGPT:', error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to inject article into ChatGPT'),
        };
      }
    }

    return {
      success: false,
      error: new Error('Invalid service URL'),
    };
  }
}
