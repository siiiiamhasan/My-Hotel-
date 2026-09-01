/**
 * Google Drive OAuth 2.0 & Cloud Sync Engine for My Hotel Manager
 * Bridges legacy utilities to the unified src/sync engine.
 */

import { getSyncEngine, getAuthAdapter, isElectronApp, SYNC_STATUS } from '../sync';
import { GoogleDriveService } from '../sync/driveApi';
import { DB_FILENAME, GOOGLE_SCOPES } from '../sync/types';

export { DB_FILENAME, GOOGLE_SCOPES, SYNC_STATUS };

export const getGoogleConfig = async () => {
  const adapter = getAuthAdapter();
  if (typeof adapter.getConfig === 'function') {
    return await adapter.getConfig();
  }
  return { clientId: '', clientSecret: '' };
};

export const saveGoogleConfig = async (config) => {
  const adapter = getAuthAdapter();
  if (typeof adapter.saveConfig === 'function') {
    await adapter.saveConfig(config);
  }
};

export const getStoredTokens = async () => {
  const adapter = getAuthAdapter();
  if (typeof adapter.getStoredTokens === 'function') {
    return await adapter.getStoredTokens();
  }
  return null;
};

export const clearStoredTokens = async () => {
  const adapter = getAuthAdapter();
  await adapter.logout();
};

export const getValidAccessToken = async () => {
  const adapter = getAuthAdapter();
  const { token } = await adapter.getValidAccessToken();
  return token;
};

export const startGoogleSignIn = async (clientId, onTokenReceived, onError) => {
  const adapter = getAuthAdapter();
  try {
    if (isElectronApp()) {
      const tokens = await adapter.login();
      if (onTokenReceived) {
        onTokenReceived(tokens.accessToken, { email: tokens.userEmail, name: tokens.userName });
      }
    } else {
      await adapter.login(
        async (accessToken) => {
          const profile = await GoogleDriveService.fetchUserProfile(accessToken);
          if (onTokenReceived) onTokenReceived(accessToken, profile);
        },
        (err) => {
          if (onError) onError(err);
        }
      );
    }
  } catch (err) {
    if (onError) onError(err);
  }
};

export const fetchGoogleUserProfile = async (accessToken) => {
  return await GoogleDriveService.fetchUserProfile(accessToken);
};

export const findDriveDatabaseFile = async (accessToken) => {
  return await GoogleDriveService.findDatabaseFile(accessToken);
};

export const downloadDriveDatabase = async (fileId, accessToken) => {
  return await GoogleDriveService.downloadDatabase(fileId, accessToken);
};

export const uploadDriveDatabase = async (localData, accessToken, existingFileId = null) => {
  return await GoogleDriveService.uploadDatabase(localData, accessToken, existingFileId);
};

export const pullFromGoogleDrive = async (localData) => {
  const engine = getSyncEngine();
  return await engine.pullInitial(localData);
};

export const pushToGoogleDrive = async (localData) => {
  const engine = getSyncEngine();
  return await engine.pushNow(localData);
};
