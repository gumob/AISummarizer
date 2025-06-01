import { db } from '@/db';
import { logger } from '@/utils';

const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1時間

export class CleanupDBService {
  private cleanupInterval: number | null = null;

  async startCleanup() {
    if (this.cleanupInterval) return;

    this.cleanupInterval = window.setInterval(async () => {
      await this.checkAndCleanup();
    }, CLEANUP_INTERVAL);

    // 初回実行
    await this.checkAndCleanup();
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private async checkAndCleanup() {
    const lastCleanup = await db.getLastCleanupDate();
    if (!lastCleanup || Date.now() - lastCleanup.getTime() > CLEANUP_INTERVAL) {
      logger.debug('Starting cleanup');
      await db.cleanup();
      logger.debug('Cleanup completed');
    }
  }
}
