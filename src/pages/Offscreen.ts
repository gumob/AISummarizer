import { OffscreenThemeService } from '@/features/offscreen/service';
import { logger } from '@/utils';

logger.debug('📄🖥️', '[Offscreen.ts]', 'Initializing offscreen document');

/** Initialize the theme detection service */
const offscreenThemeService = new OffscreenThemeService();
offscreenThemeService.initialize();
