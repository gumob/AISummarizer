import { DBSchema, IDBPDatabase, openDB } from 'idb';

import { isBrowserSpecificUrl, logger } from '@/utils';

/**
 * ArticleRecord
 * - id: string
 * - url: string
 * - title: string | null
 * - content: string | null
 * - date: Date
 * - is_success: boolean
 */
export interface ArticleRecord {
  id: string;
  url: string;
  title: string | null;
  content: string | null;
  date: Date;
  is_success: boolean;
}

/**
 * AISummarizerDB
 * - articles: ArticleRecord
 * - metadata: {
 *   key: string;
 *   lastCleanup: Date;
 * }
 */
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
      key: string;
      lastCleanup: Date;
    };
  };
}

const DB_NAME = 'ai-summarizer-db';
const DB_VERSION = 1;
const MAX_RECORDS = 200;

/**
 * Database
 * - init: Initialize the database
 * - addArticle: Add an article to the database
 * - getArticleByUrl: Get an article by its URL
 * - cleanup: Clean up the database
 * - getLastCleanupDate: Get the last cleanup date
 */
export class Database {
  private db: IDBPDatabase<AISummarizerDB> | null = null;
  private static instance: Database | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Initialize the database
   */
  async init() {
    try {
      logger.debug('💾', '[Database.tsx]', '[init]', 'Initializing IndexedDB');
      if (this.db) {
        logger.debug('💾', '[Database.tsx]', '[init]', 'Database already initialized');
        return;
      }

      this.db = await openDB<AISummarizerDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
          logger.debug('💾', '[Database.tsx]', '[init]', 'Upgrading database:', { oldVersion, newVersion });
          const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
          articleStore.createIndex('by-url', 'url');
          articleStore.createIndex('by-date', 'date');

          db.createObjectStore('metadata', { keyPath: 'key' });
          logger.debug('💾', '[Database.tsx]', '[init]', 'Database upgrade completed');
        },
        blocked() {
          logger.warn('💾', '[Database.tsx]', '[init]', 'Database blocked');
        },
        blocking() {
          logger.warn('💾', '[Database.tsx]', '[init]', 'Database blocking');
        },
        terminated() {
          logger.warn('💾', '[Database.tsx]', '[init]', 'Database terminated');
        },
      });

      // Verify database connection
      const tx = this.db.transaction('articles', 'readonly');
      await tx.done;
    } catch (error) {
      logger.error('💾', '[Database.tsx]', '[init]', 'Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Add an article to the database
   * @param article - The article to add
   * @returns The ID of the added article
   */
  async addArticle(article: Omit<ArticleRecord, 'id'>) {
    try {
      if (!this.db) await this.init();
      const id = crypto.randomUUID();
      logger.debug('💾', '[Database.tsx]', '[addArticle]', 'Adding article to database:', { id, url: article.url });

      /** Search for an entry with the same URL. */
      const existingArticle = await this.getArticleByUrl(article.url);
      if (existingArticle) {
        logger.debug('💾', '[Database.tsx]', '[addArticle]', 'Updating existing article:', { id: existingArticle.id, url: article.url });
        await this.db!.put('articles', { ...article, id: existingArticle.id });
        logger.debug('💾', '[Database.tsx]', '[addArticle]', 'Article updated successfully');
        return existingArticle.id;
      }

      /** Add a new entry. */
      await this.db!.add('articles', { ...article, id });
      logger.debug('💾', '[Database.tsx]', '[addArticle]', 'Article added successfully');
      return id;
    } catch (error) {
      logger.error('💾', '[Database.tsx]', '[addArticle]', 'Failed to add article:', error);
      throw error;
    }
  }

  /**
   * Get an article by its URL
   * @param url - The URL of the article
   * @returns The article
   */
  async getArticleByUrl(url: string): Promise<ArticleRecord | undefined> {
    try {
      /** Skip processing for browser-specific URLs */
      if (isBrowserSpecificUrl(url)) {
        logger.warn('💾', '[Database.tsx]', '[getArticleByUrl]', 'Skipping extraction for browser-specific URLs', url);
        return undefined;
      }

      if (!this.db) await this.init();
      // logger.debug('💾', '[Database.tsx]', '[getArticleByUrl]', 'Getting article by url:', url);
      const tx = this.db!.transaction('articles', 'readonly');
      const index = tx.store.index('by-url');
      const article = await index.get(url);
      // logger.debug('💾', '[Database.tsx]', '[getArticleByUrl]', 'Found article:', article);

      await tx.done;
      return article;
    } catch (error) {
      logger.error('💾', '[Database.tsx]', '[getArticleByUrl]', 'Failed to get article by url:', error);
      throw error;
    }
  }

  /**
   * Clean up the database
   */
  async cleanup() {
    if (!this.db) await this.init();
    logger.debug('💾', '[Database.tsx]', '[cleanup]', 'Cleaning up database');
    const tx = this.db!.transaction('articles', 'readwrite');
    const store = tx.store;
    const index = store.index('by-date');

    /** Delete records older than 24 hours. */
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.date < oneDayAgo) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }

    /** Delete records if the number of records exceeds 200. */
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

    /** Update the last cleanup date. */
    const metadataTx = this.db!.transaction('metadata', 'readwrite');
    await metadataTx.store.put({ key: 'lastCleanup', lastCleanup: new Date() });
  }

  /**
   * Get the last cleanup date
   * @returns The last cleanup date
   */
  async getLastCleanupDate(): Promise<Date | null> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('metadata', 'readonly');
    const record = await tx.store.get('lastCleanup');
    return record?.lastCleanup || null;
  }
}

export const db = Database.getInstance();
