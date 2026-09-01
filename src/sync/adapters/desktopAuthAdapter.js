import { SYNC_STATUS } from '../types';

export class DesktopAuthAdapter {
  isElectron() {
    return typeof window !== 'undefined' && (!!window.api || !!window.electronAuth);
  }

  async login() {
    if (!this.isElectron()) {
      throw new Error('Electron Auth bridge is not available in this environment');
    }
    if (window.api?.signIn) {
      return await window.api.signIn();
    }
    return await window.electronAuth.login();
  }

  async logout() {
    if (this.isElectron()) {
      if (window.api?.signOut) {
        await window.api.signOut();
      } else {
        await window.electronAuth.logout();
      }
    }
  }

  async getStoredTokens() {
    if (this.isElectron()) {
      if (window.api?.getAuthState) {
        return await window.api.getAuthState();
      }
      return await window.electronAuth.getTokens();
    }
    return null;
  }

  async getValidAccessToken() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { token: null, status: SYNC_STATUS.OFFLINE };
    }

    if (!this.isElectron()) {
      return { token: null, status: SYNC_STATUS.UNAUTHENTICATED };
    }

    if (window.api?.getAuthState) {
      const state = await window.api.getAuthState();
      if (!state || !state.isConnected) {
        return { token: null, status: SYNC_STATUS.UNAUTHENTICATED };
      }
      return { token: 'electron-active', status: 'ok' };
    }

    const tokens = await window.electronAuth.getTokens();
    if (!tokens || !tokens.accessToken) {
      return { token: null, status: SYNC_STATUS.UNAUTHENTICATED };
    }

    const isExpired = tokens.expiresAt && Date.now() >= tokens.expiresAt - 120000;
    if (!isExpired) {
      return { token: tokens.accessToken, status: 'ok' };
    }

    try {
      const refreshedToken = await window.electronAuth.refreshToken();
      if (refreshedToken) {
        return { token: refreshedToken, status: 'ok' };
      }
      return { token: null, status: SYNC_STATUS.AUTH_ERROR };
    } catch (e) {
      console.warn('Desktop silent token refresh failed:', e);
      return { token: null, status: SYNC_STATUS.AUTH_ERROR };
    }
  }
}
