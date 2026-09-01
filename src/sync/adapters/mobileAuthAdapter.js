import { Preferences } from '@capacitor/preferences';
import { SYNC_STATUS, GOOGLE_SCOPES } from '../types';
import googleConfigJson from '../../../config/google-config.json';

const TOKEN_STORAGE_KEY = 'my_hotel_google_auth_tokens_v1';
const CONFIG_STORAGE_KEY = 'google_custom_config';

export class MobileAuthAdapter {
  constructor() {
    this.bundledConfig = googleConfigJson || {};
  }

  async getConfig() {
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID)) {
        return {
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          androidClientId: import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          desktopClientId: import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_ID || '',
          projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID || '',
        };
      }
      const { value } = await Preferences.get({ key: CONFIG_STORAGE_KEY });
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed.clientId) return parsed;
      }
    } catch (e) {}
    return this.bundledConfig;
  }

  async saveConfig(config) {
    await Preferences.set({
      key: CONFIG_STORAGE_KEY,
      value: JSON.stringify(config),
    });
  }

  async getStoredTokens() {
    try {
      const { value } = await Preferences.get({ key: TOKEN_STORAGE_KEY });
      if (value) return JSON.parse(value);
      if (typeof localStorage !== 'undefined') {
        const local = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (local) return JSON.parse(local);
      }
    } catch (e) {}
    return null;
  }

  async saveStoredTokens(tokens) {
    try {
      const serialized = JSON.stringify(tokens);
      await Preferences.set({ key: TOKEN_STORAGE_KEY, value: serialized });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, serialized);
      }
    } catch (e) {}
  }

  async clearTokens() {
    try {
      await Preferences.remove({ key: TOKEN_STORAGE_KEY });
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (e) {}
  }

  async login(onTokenReceived, onError) {
    const config = await this.getConfig();
    const clientId = config.clientId || config.androidClientId;

    if (!clientId) {
      if (onError) onError(new Error('Google Client ID is missing. Please configure credentials.'));
      return;
    }

    if (typeof window !== 'undefined' && window.google && window.google.accounts) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_SCOPES,
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              const tokens = {
                accessToken: tokenResponse.access_token,
                expiresAt: Date.now() + (tokenResponse.expires_in || 3600) * 1000,
              };
              await this.saveStoredTokens(tokens);

              if (onTokenReceived) {
                onTokenReceived(tokens.accessToken);
              }
            } else if (tokenResponse && tokenResponse.error) {
              if (onError) onError(new Error(tokenResponse.error));
            }
          },
          error_callback: (err) => {
            if (onError) onError(err);
          },
        });
        client.requestAccessToken({ prompt: 'consent' });
        return;
      } catch (e) {
        console.error('GIS client error:', e);
        if (onError) onError(e);
      }
    } else {
      if (onError) onError(new Error('Google Identity client is loading or not available.'));
    }
  }

  async logout() {
    await this.clearTokens();
  }

  async refreshToken() {
    const tokens = await this.getStoredTokens();
    if (!tokens || !tokens.refreshToken) return null;

    const config = await this.getConfig();
    const clientId = config.clientId || config.androidClientId;
    if (!clientId) return null;

    try {
      const params = new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
      });

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const updatedTokens = {
        ...tokens,
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };

      await this.saveStoredTokens(updatedTokens);
      return updatedTokens.accessToken;
    } catch (err) {
      console.error('Error refreshing mobile token:', err);
      return null;
    }
  }

  async getValidAccessToken() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { token: null, status: SYNC_STATUS.OFFLINE };
    }

    const tokens = await this.getStoredTokens();
    if (!tokens || !tokens.accessToken) {
      return { token: null, status: SYNC_STATUS.UNAUTHENTICATED };
    }

    const isExpired = tokens.expiresAt && Date.now() >= tokens.expiresAt - 120000;
    if (!isExpired) {
      return { token: tokens.accessToken, status: 'ok' };
    }

    if (tokens.refreshToken) {
      const refreshed = await this.refreshToken();
      if (refreshed) return { token: refreshed, status: 'ok' };
      return { token: null, status: SYNC_STATUS.AUTH_ERROR };
    }

    // Token expired and no refresh token available
    return { token: null, status: SYNC_STATUS.AUTH_ERROR };
  }
}
