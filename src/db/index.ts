import {
  DBSchema,
  IDBPDatabase,
  openDB,
} from 'idb';

interface ArticleRecord {
  id: string;
  url: string;
  title: string | null;
  content: string | null;
  date: Date;
  is_extracted: boolean;
}

interface AISummarizerDB extends DBSchema {
  articles: {
    key: string;
    value: ArticleRecord;
    indexes: {
      'by-url': string;
      'by-date': Date;
    };
  };
  metadata: {
    key: string;
    value: {
      lastCleanup: Date;
    };
  };
}

const DB_NAME = 'ai-summarizer-db';
const DB_VERSION = 1;
const MAX_RECORDS = 200;

export class Database {
  private db: IDBPDatabase<AISummarizerDB> | null = null;

  async init() {
    this.db = await openDB<AISummarizerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
        articleStore.createIndex('by-url', 'url');
        articleStore.createIndex('by-date', 'date');

        db.createObjectStore('metadata', { keyPath: 'key' });
      },
    });
  }

  async addArticle(article: Omit<ArticleRecord, 'id'>) {
    if (!this.db) await this.init();
    const id = crypto.randomUUID();
    await this.db!.add('articles', { ...article, id });
    return id;
  }

  async getArticleByUrl(url: string): Promise<ArticleRecord | undefined> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('articles', 'readonly');
    const index = tx.store.index('by-url');
    return await index.get(url);
  }

  async cleanup() {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('articles', 'readwrite');
    const store = tx.store;
    const index = store.index('by-date');

    // 24時間以上前のレコードを削除
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.date < oneDayAgo) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }

    // レコード数が200を超える場合、古いものから削除
    const count = await store.count();
    if (count > MAX_RECORDS) {
      const deleteCount = count - MAX_RECORDS;
      cursor = await index.openCursor();
      let deleted = 0;
      while (cursor && deleted < deleteCount) {
        await cursor.delete();
        deleted++;
        cursor = await cursor.continue();
      }
    }

    // 最終クリーンアップ日時を更新
    const metadataTx = this.db!.transaction('metadata', 'readwrite');
    await metadataTx.store.put({ lastCleanup: new Date() }, 'lastCleanup');
  }

  async getLastCleanupDate(): Promise<Date | null> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('metadata', 'readonly');
    const record = await tx.store.get('lastCleanup');
    return record?.lastCleanup || null;
  }
}

export const db = new Database();
