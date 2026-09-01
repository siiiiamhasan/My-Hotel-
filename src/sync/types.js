/**
 * Sync System Types & Constants
 */

export const DB_FILENAME = 'hotel-management-data.json';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

/**
 * Sync Status definitions:
 * - 'idle': Initial state or waiting
 * - 'syncing': Currently uploading or downloading data
 * - 'synced': Up to date with Google Drive
 * - 'offline': No internet connection detected
 * - 'unauthenticated': Not signed in with Google
 * - 'auth_error': Refresh token invalid / authentication failed
 * - 'error': General network or sync exception
 */
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  OFFLINE: 'offline',
  UNAUTHENTICATED: 'unauthenticated',
  AUTH_ERROR: 'auth_error',
  ERROR: 'error',
};
