import { SyncEngine } from './syncEngine';
import { DesktopAuthAdapter } from './adapters/desktopAuthAdapter';
import { MobileAuthAdapter } from './adapters/mobileAuthAdapter';
import { SYNC_STATUS, DB_FILENAME, GOOGLE_SCOPES } from './types';

let syncEngineInstance = null;
let authAdapterInstance = null;

export const isElectronApp = () => {
  return typeof window !== 'undefined' && !!window.electronAuth;
};

export const getAuthAdapter = () => {
  if (!authAdapterInstance) {
    if (isElectronApp()) {
      authAdapterInstance = new DesktopAuthAdapter();
    } else {
      authAdapterInstance = new MobileAuthAdapter();
    }
  }
  return authAdapterInstance;
};

export const getSyncEngine = (onStatusChange = null) => {
  if (!syncEngineInstance) {
    const adapter = getAuthAdapter();
    syncEngineInstance = new SyncEngine(adapter, onStatusChange);
  } else if (onStatusChange) {
    syncEngineInstance.onStatusChange = onStatusChange;
  }
  return syncEngineInstance;
};

export { SYNC_STATUS, DB_FILENAME, GOOGLE_SCOPES, SyncEngine };
