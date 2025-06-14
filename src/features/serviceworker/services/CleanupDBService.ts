import { db } from '@/db/Database';
import { useArticleStore } from '@/stores/ArticleStore';
import { logger } from '@/utils';

const CLEANUP_INTERVAL = 60 * 60; // 1時間（分単位）

export class CleanupDBService {
  private alarmName = 'cleanup-db';

  async startCleanup() {
    /** Clear existing alarm */
    await chrome.alarms.clear(this.alarmName);

    /** Set new alarm */
    await chrome.alarms.create(this.alarmName, {
      periodInMinutes: CLEANUP_INTERVAL,
    });

    /** Set alarm listener */
    chrome.alarms.onAlarm.removeListener(this.handleAlarm.bind(this));
    chrome.alarms.onAlarm.addListener(this.handleAlarm.bind(this));

    /** Run initial cleanup */
    await this.checkAndCleanup();
  }

  private handleAlarm(alarm: chrome.alarms.Alarm) {
    if (alarm.name === this.alarmName) {
      this.checkAndCleanup();
    }
  }

  stopCleanup() {
    chrome.alarms.clear(this.alarmName);
  }

  private async checkAndCleanup() {
    const lastCleanup = await useArticleStore.getState().getLastCleanupDate();
    if (!lastCleanup || Date.now() - lastCleanup.getTime() > CLEANUP_INTERVAL * 60 * 1000) {
      logger.debug('🧑‍🍳💾', '[CleanupDBService.tsx]', '[checkAndCleanup]', 'Starting cleanup');
      await db.cleanupOldArticles();
      logger.debug('🧑‍🍳💾', '[CleanupDBService.tsx]', '[checkAndCleanup]', 'Cleanup completed');
    }
  }
}
