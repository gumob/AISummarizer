import { db } from '@/db';
import { logger } from '@/utils';

const CLEANUP_INTERVAL = 60 * 60; // 1時間（分単位）

export class CleanupDBService {
  private alarmName = 'cleanup-db';

  async startCleanup() {
    // 既存のアラームをクリア
    await chrome.alarms.clear(this.alarmName);

    // 新しいアラームを設定
    await chrome.alarms.create(this.alarmName, {
      periodInMinutes: CLEANUP_INTERVAL,
    });

    // アラームのリスナーを設定
    chrome.alarms.onAlarm.addListener(async alarm => {
      if (alarm.name === this.alarmName) {
        await this.checkAndCleanup();
      }
    });

    // 初回実行
    await this.checkAndCleanup();
  }

  stopCleanup() {
    chrome.alarms.clear(this.alarmName);
  }

  private async checkAndCleanup() {
    const lastCleanup = await db.getLastCleanupDate();
    if (!lastCleanup || Date.now() - lastCleanup.getTime() > CLEANUP_INTERVAL * 60 * 1000) {
      logger.debug('Starting cleanup');
      await db.cleanup();
      logger.debug('Cleanup completed');
    }
  }
}
