import { GoogleDriveService } from './driveApi';
import { SYNC_STATUS } from './types';

export class SyncEngine {
  constructor(authAdapter, onStatusChange = null) {
    this.authAdapter = authAdapter;
    this.onStatusChange = onStatusChange;
    this.debounceTimer = null;
    this.currentStatus = SYNC_STATUS.IDLE;
    this.lastSyncedAt = null;

    // Listen for online/offline events if in browser/DOM environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  setStatus(status, errorMessage = null) {
    this.currentStatus = status;
    if (status === SYNC_STATUS.SYNCED) {
      this.lastSyncedAt = new Date().toISOString();
    }
    if (typeof this.onStatusChange === 'function') {
      this.onStatusChange({
        status: this.currentStatus,
        lastSyncedAt: this.lastSyncedAt,
        error: errorMessage,
      });
    }
  }

  isOnline() {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  }

  handleNetworkChange(online) {
    if (!online) {
      this.setStatus(SYNC_STATUS.OFFLINE);
    } else {
      // Transition out of offline
      if (this.currentStatus === SYNC_STATUS.OFFLINE) {
        this.setStatus(SYNC_STATUS.IDLE);
      }
    }
  }

  /**
   * Conflict Resolution Strategy: Granular Entity-Level Bidirectional Merge
   * Merges records from both PC & Mobile into a single unified dataset.
   */
  resolveConflict(localData, remoteData) {
    if (!remoteData) return localData;
    if (!localData) return remoteData;

    // Merge daily_records by date (union of all dates, newest record wins on conflict)
    const recordMap = new Map();
    (remoteData.daily_records || []).forEach(r => {
      if (r && r.date) recordMap.set(r.date, r);
    });
    (localData.daily_records || []).forEach(r => {
      if (r && r.date) {
        const existing = recordMap.get(r.date);
        if (!existing) {
          recordMap.set(r.date, r);
        } else {
          const localTime = new Date(r.lastUpdated || r.updatedAt || localData.updatedAt || 0).getTime();
          const remoteTime = new Date(existing.lastUpdated || existing.updatedAt || remoteData.updatedAt || 0).getTime();
          recordMap.set(r.date, localTime >= remoteTime ? r : existing);
        }
      }
    });

    const mergedDailyRecords = Array.from(recordMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Merge owners by id or name
    const ownerMap = new Map();
    (remoteData.owners || []).forEach(o => { if (o) ownerMap.set(o.id || o.name, o); });
    (localData.owners || []).forEach(o => { if (o) ownerMap.set(o.id || o.name, o); });

    // Merge staff by id or name
    const staffMap = new Map();
    (remoteData.staff || []).forEach(s => { if (s) staffMap.set(s.id || s.name, s); });
    (localData.staff || []).forEach(s => { if (s) staffMap.set(s.id || s.name, s); });

    // Merge fixed_assets by id
    const assetMap = new Map();
    (remoteData.fixed_assets || []).forEach(a => { if (a) assetMap.set(a.id, a); });
    (localData.fixed_assets || []).forEach(a => { if (a) assetMap.set(a.id, a); });

    // Merge monthly_bills by id
    const billMap = new Map();
    (remoteData.monthly_bills || []).forEach(b => { if (b) billMap.set(b.id, b); });
    (localData.monthly_bills || []).forEach(b => { if (b) billMap.set(b.id, b); });

    return {
      restaurant_info: {
        ...(remoteData.restaurant_info || {}),
        ...(localData.restaurant_info || {}),
        google_drive_connected: true,
        last_synced_at: new Date().toISOString(),
      },
      initial_investment: Number(localData.initial_investment || remoteData.initial_investment || 0),
      owners: Array.from(ownerMap.values()),
      staff: Array.from(staffMap.values()),
      fixed_assets: Array.from(assetMap.values()),
      monthly_bills: Array.from(billMap.values()),
      daily_records: mergedDailyRecords,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Startup Pull: Pulls latest data from Google Drive and merges with local state
   */
  async pullInitial(localData) {
    if (!this.isOnline()) {
      this.setStatus(SYNC_STATUS.OFFLINE);
      return { success: false, error: 'Network is offline', data: localData };
    }

    const { token, status } = await this.authAdapter.getValidAccessToken();
    if (!token) {
      this.setStatus(status);
      return { success: false, status, data: localData };
    }

    try {
      this.setStatus(SYNC_STATUS.SYNCING);
      const file = await GoogleDriveService.findDatabaseFile(token);

      if (file) {
        const remoteData = await GoogleDriveService.downloadDatabase(file.id, token);
        const resolvedData = this.resolveConflict(localData, remoteData);
        this.setStatus(SYNC_STATUS.SYNCED);
        return {
          success: true,
          action: 'PULLED_FROM_DRIVE',
          syncedAt: new Date().toISOString(),
          fileId: file.id,
          data: resolvedData,
        };
      } else {
        // Initial file creation on Drive
        const uploaded = await GoogleDriveService.uploadDatabase(localData, token);
        this.setStatus(SYNC_STATUS.SYNCED);
        return {
          success: true,
          action: 'INITIAL_FILE_CREATED',
          syncedAt: new Date().toISOString(),
          fileId: uploaded.id,
          data: {
            ...localData,
            restaurant_info: {
              ...localData.restaurant_info,
              google_drive_connected: true,
              last_synced_at: new Date().toISOString(),
            }
          },
        };
      }
    } catch (err) {
      console.error('Pull from Google Drive failed:', err);
      this.setStatus(SYNC_STATUS.ERROR, err.message);
      return { success: false, error: err.message, data: localData };
    }
  }

  /**
   * Schedule debounced background push
   */
  schedulePush(data, delayMs = 1800) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    const payloadWithTime = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.debounceTimer = setTimeout(async () => {
      await this.pushNow(payloadWithTime);
    }, delayMs);
  }

  /**
   * Execute immediate Push to Google Drive
   */
  async pushNow(data) {
    if (!this.isOnline()) {
      this.setStatus(SYNC_STATUS.OFFLINE);
      return { success: false, status: SYNC_STATUS.OFFLINE, data };
    }

    const { token, status } = await this.authAdapter.getValidAccessToken();
    if (!token) {
      this.setStatus(status);
      return { success: false, status, data };
    }

    try {
      this.setStatus(SYNC_STATUS.SYNCING);
      const file = await GoogleDriveService.findDatabaseFile(token);

      const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
        restaurant_info: {
          ...data.restaurant_info,
          google_drive_connected: true,
          last_synced_at: new Date().toISOString(),
        }
      };

      const result = await GoogleDriveService.uploadDatabase(payload, token, file?.id);
      this.setStatus(SYNC_STATUS.SYNCED);
      return {
        success: true,
        action: 'PUSHED_TO_DRIVE',
        syncedAt: new Date().toISOString(),
        fileId: result.id || file?.id,
        data: payload,
      };
    } catch (err) {
      console.error('Push to Google Drive failed:', err);
      this.setStatus(SYNC_STATUS.ERROR, err.message);
      return { success: false, error: err.message, data };
    }
  }
}
