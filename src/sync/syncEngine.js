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
   * Conflict Resolution Strategy
   *
   * [MVP Strategy: Last-Write-Wins based on document updatedAt]
   *
   * TODO (Future Enhancement - Granular Entity Merge):
   * When multiple devices (e.g. PC cashier & mobile manager) make concurrent updates:
   * 1. Extract array collections (daily_records, monthly_fixed_expenses, family_members).
   * 2. Key entities by unique ID (e.g., date for daily_records, id for expenses).
   * 3. For matching records, compare item-level updatedAt timestamp to preserve field-level updates.
   * 4. For new records present in either local or remote, union them into the merged dataset.
   */
  resolveConflict(localData, remoteData) {
    if (!remoteData) return localData;
    if (!localData) return remoteData;

    const localTime = new Date(localData?.updatedAt || localData?.restaurant_info?.last_synced_at || 0).getTime();
    const remoteTime = new Date(remoteData?.updatedAt || remoteData?.restaurant_info?.last_synced_at || 0).getTime();

    // If remote has newer changes, return remote
    if (remoteTime > localTime) {
      return {
        ...remoteData,
        restaurant_info: {
          ...remoteData.restaurant_info,
          google_drive_connected: true,
          last_synced_at: new Date().toISOString(),
        }
      };
    }

    return {
      ...localData,
      restaurant_info: {
        ...localData.restaurant_info,
        google_drive_connected: true,
        last_synced_at: new Date().toISOString(),
      }
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
