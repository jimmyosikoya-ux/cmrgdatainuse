/**
 * CMRG Data Collect - Durable IndexedDB Storage Engine
 * Provides schema versioning, transactional writes, idempotency keys,
 * and reliable offline storage with automatic localStorage fallback.
 */

import { FormSubmission, FormDefinition, HouseholdCase, StoredDraft, AuditLogEntry } from '../types/survey';

const DB_NAME = 'CMRG_COLLECT_OFFLINE_DB';
const DB_VERSION = 2;

export interface QueueItem {
  id: string; // submission.id
  idempotency_key: string;
  form_id: string;
  submission: FormSubmission;
  status: 'pending' | 'synchronizing' | 'synchronized' | 'failed';
  retry_count: number;
  last_attempt_at?: string;
  last_error?: string;
  server_receipt?: {
    receipt_id: string;
    server_time: string;
    acknowledgement_token: string;
  };
  created_at: string;
}

export interface MediaItem {
  id: string;
  submission_id: string;
  field_id: string;
  file_name: string;
  file_type: string;
  data_base64: string;
  size_bytes: number;
  upload_status: 'pending' | 'uploaded' | 'failed';
  created_at: string;
}

class IndexedDBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isSupported: boolean = typeof window !== 'undefined' && 'indexedDB' in window;

  private getDB(): Promise<IDBDatabase> {
    if (!this.isSupported) {
      return Promise.reject(new Error('IndexedDB not supported in this environment'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // 1. Offline Queue store with indexes
            if (!db.objectStoreNames.contains('offline_queue')) {
              const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' });
              queueStore.createIndex('by_status', 'status', { unique: false });
              queueStore.createIndex('by_idempotency_key', 'idempotency_key', { unique: true });
              queueStore.createIndex('by_created_at', 'created_at', { unique: false });
            }

            // 2. Drafts store
            if (!db.objectStoreNames.contains('drafts')) {
              db.createObjectStore('drafts', { keyPath: 'id' });
            }

            // 3. Submissions store
            if (!db.objectStoreNames.contains('submissions')) {
              const subStore = db.createObjectStore('submissions', { keyPath: 'id' });
              subStore.createIndex('by_form_id', 'form_id', { unique: false });
              subStore.createIndex('by_status', 'status', { unique: false });
            }

            // 4. Cases store
            if (!db.objectStoreNames.contains('cases')) {
              const caseStore = db.createObjectStore('cases', { keyPath: 'id' });
              caseStore.createIndex('by_assigned_enumerator', 'assigned_enumerator_id', { unique: false });
              caseStore.createIndex('by_status', 'status', { unique: false });
            }

            // 5. Forms cache store
            if (!db.objectStoreNames.contains('forms')) {
              db.createObjectStore('forms', { keyPath: 'id' });
            }

            // 6. Media attachments store
            if (!db.objectStoreNames.contains('media_attachments')) {
              const mediaStore = db.createObjectStore('media_attachments', { keyPath: 'id' });
              mediaStore.createIndex('by_submission_id', 'submission_id', { unique: false });
            }

            // 7. Audit log store
            if (!db.objectStoreNames.contains('audit_logs')) {
              db.createObjectStore('audit_logs', { keyPath: 'id' });
            }
          };

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            reject(request.error);
          };
        } catch (err) {
          reject(err);
        }
      });
    }

    return this.dbPromise;
  }

  // Generic transaction helper
  private async withTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => Promise<T> | T
  ): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);

        let result: any;
        const opPromise = Promise.resolve(callback(store));

        opPromise
          .then((res) => {
            result = res;
          })
          .catch(reject);

        tx.oncomplete = () => {
          resolve(result);
        };

        tx.onerror = () => {
          reject(tx.error);
        };

        tx.onabort = () => {
          reject(new Error(`IndexedDB transaction aborted in store: ${storeName}`));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  // ================= QUEUE OPERATIONS =================

  public async addToQueue(submission: FormSubmission): Promise<QueueItem> {
    const idempotencyKey = `idemp_${submission.id}_${Date.now()}`;
    const queueItem: QueueItem = {
      id: submission.id,
      idempotency_key: idempotencyKey,
      form_id: submission.form_id,
      submission,
      status: 'pending',
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    try {
      await this.withTransaction('offline_queue', 'readwrite', (store) => {
        store.put(queueItem);
      });
    } catch (err) {
      console.warn('IDB queue save failed, falling back to localStorage:', err);
      // Fallback
      const current = JSON.parse(localStorage.getItem('cmrg_idb_queue_backup') || '[]');
      current.push(queueItem);
      localStorage.setItem('cmrg_idb_queue_backup', JSON.stringify(current));
    }

    return queueItem;
  }

  public async getQueue(): Promise<QueueItem[]> {
    try {
      return await this.withTransaction('offline_queue', 'readonly', (store) => {
        return new Promise<QueueItem[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      });
    } catch {
      try {
        return JSON.parse(localStorage.getItem('cmrg_idb_queue_backup') || '[]');
      } catch {
        return [];
      }
    }
  }

  public async updateQueueStatus(
    id: string,
    status: QueueItem['status'],
    error?: string,
    receipt?: QueueItem['server_receipt']
  ): Promise<void> {
    try {
      await this.withTransaction('offline_queue', 'readwrite', async (store) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const item: QueueItem = getReq.result;
          if (item) {
            item.status = status;
            item.last_attempt_at = new Date().toISOString();
            if (status === 'failed') {
              item.retry_count = (item.retry_count || 0) + 1;
              item.last_error = error;
            }
            if (receipt) {
              item.server_receipt = receipt;
            }
            store.put(item);
          }
        };
      });
    } catch (err) {
      console.warn('IDB updateQueueStatus error:', err);
    }
  }

  public async removeFromQueue(id: string): Promise<void> {
    try {
      await this.withTransaction('offline_queue', 'readwrite', (store) => {
        store.delete(id);
      });
    } catch (err) {
      console.warn('IDB removeFromQueue error:', err);
    }
  }

  // ================= DRAFT OPERATIONS =================

  public async saveDraft(draft: StoredDraft): Promise<void> {
    try {
      await this.withTransaction('drafts', 'readwrite', (store) => {
        store.put(draft);
      });
    } catch {
      // Fallback handled by caller
    }
  }

  public async getDrafts(): Promise<StoredDraft[]> {
    try {
      return await this.withTransaction('drafts', 'readonly', (store) => {
        return new Promise<StoredDraft[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      });
    } catch {
      return [];
    }
  }

  public async deleteDraft(id: string): Promise<void> {
    try {
      await this.withTransaction('drafts', 'readwrite', (store) => {
        store.delete(id);
      });
    } catch (err) {
      console.warn('IDB deleteDraft error:', err);
    }
  }

  // ================= SUBMISSIONS =================

  public async saveSubmission(sub: FormSubmission): Promise<void> {
    try {
      await this.withTransaction('submissions', 'readwrite', (store) => {
        store.put(sub);
      });
    } catch (err) {
      console.warn('IDB saveSubmission error:', err);
    }
  }

  public async getSubmissions(): Promise<FormSubmission[]> {
    try {
      return await this.withTransaction('submissions', 'readonly', (store) => {
        return new Promise<FormSubmission[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      });
    } catch {
      return [];
    }
  }

  // ================= MEDIA ATTACHMENTS =================

  public async saveMedia(media: MediaItem): Promise<void> {
    try {
      await this.withTransaction('media_attachments', 'readwrite', (store) => {
        store.put(media);
      });
    } catch (err) {
      console.warn('IDB saveMedia error:', err);
    }
  }

  public async getMediaBySubmission(submissionId: string): Promise<MediaItem[]> {
    try {
      return await this.withTransaction('media_attachments', 'readonly', (store) => {
        return new Promise<MediaItem[]>((resolve, reject) => {
          const index = store.index('by_submission_id');
          const req = index.getAll(submissionId);
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      });
    } catch {
      return [];
    }
  }

  // ================= AUDIT LOGS =================

  public async recordAudit(entry: AuditLogEntry): Promise<void> {
    try {
      await this.withTransaction('audit_logs', 'readwrite', (store) => {
        store.put(entry);
      });
    } catch (err) {
      console.warn('IDB recordAudit error:', err);
    }
  }

  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      return await this.withTransaction('audit_logs', 'readonly', (store) => {
        return new Promise<AuditLogEntry[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      });
    } catch {
      return [];
    }
  }
}

export const CMRGIndexedDB = new IndexedDBManager();
