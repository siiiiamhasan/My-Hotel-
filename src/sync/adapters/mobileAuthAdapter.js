import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { SYNC_STATUS, GOOGLE_SCOPES } from '../types';
import googleConfigJson from '../../../config/google-config.json';

const TOKEN_STORAGE_KEY = 'my_hotel_google_auth_tokens_v1';
const CONFIG_STORAGE_KEY = 'google_custom_config';
const PKCE_VERIFIER_KEY = 'pkce_code_verifier_temp';

// Helper to construct Google Reverse DNS redirect URI (RFC 8252 for Native Apps)
function getReverseDnsRedirectUri(clientId) {
  if (!clientId) return 'com.siamhasan.myhotel:/oauth2redirect';
  const prefix = clientId.replace('.apps.googleusercontent.com', '').trim();
  return `com.googleusercontent.apps.${prefix}:/oauth2redirect`;
}

// Helper to generate base64url random bytes
function generateRandomString(length = 32) {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper to compute SHA-256 code challenge
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export class MobileAuthAdapter {
  constructor() {
    this.bundledConfig = googleConfigJson || {};
    this.deepLinkListenerAttached = false;
    this.pendingAuthCallback = null;

    this.initDeepLinkListener();
  }

  initDeepLinkListener() {
    if (typeof window !== 'undefined' && !this.deepLinkListenerAttached) {
      try {
        App.addListener('appUrlOpen', async (data) => {
          if (data && data.url) {
            try {
              await Browser.close();
            } catch (e) {}

            let code = null;
            let error = null;

            const matchCode = data.url.match(/[?&]code=([^&#]+)/);
            if (matchCode) {
              code = decodeURIComponent(matchCode[1]);
            }
            const matchError = data.url.match(/[?&]error=([^&#]+)/);
            if (matchError) {
              error = decodeURIComponent(matchError[1]);
            }

            if (error) {
              if (this.pendingAuthCallback?.onError) {
                this.pendingAuthCallback.onError(new Error(error));
              }
              return;
            }

            if (code) {
              await this.handleAuthCodeExchange(code);
            }
          }
        });
        this.deepLinkListenerAttached = true;
      } catch (e) {
        console.warn('App deepLink listener skipped:', e);
      }
    }
  }

  async handleAuthCodeExchange(code) {
    try {
      const config = await this.getConfig();
      const clientId = config.desktopClientId || config.clientId || config.androidClientId;
      const clientSecret = config.desktopClientSecret || config.clientSecret || '';

      const { value: verifier } = await Preferences.get({ key: PKCE_VERIFIER_KEY });
      const redirectUri = getReverseDnsRedirectUri(clientId);

      const bodyParams = {
        client_id: clientId,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      };

      if (verifier) {
        bodyParams.code_verifier = verifier;
      }
      if (clientSecret) {
        bodyParams.client_secret = clientSecret;
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(bodyParams),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Token exchange failed: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const tokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      };

      await this.saveStoredTokens(tokens);

      if (this.pendingAuthCallback?.onSuccess) {
        this.pendingAuthCallback.onSuccess(tokens.accessToken);
      }
    } catch (err) {
      console.error('Auth code exchange error:', err);
      if (this.pendingAuthCallback?.onError) {
        this.pendingAuthCallback.onError(err);
      }
    } finally {
      await Preferences.remove({ key: PKCE_VERIFIER_KEY });
    }
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
    const clientSecret = config.clientSecret || '';

    if (!clientId) {
      if (onError) onError(new Error('Google Client ID is missing. Please configure credentials.'));
      return;
    }

    this.pendingAuthCallback = {
      onSuccess: onTokenReceived,
      onError: onError,
    };

    const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isNative) {
      try {
        const nativeClientId = config.desktopClientId || config.clientId || config.androidClientId;
        const verifier = generateRandomString(32);
        const challenge = await generateCodeChallenge(verifier);
        await Preferences.set({ key: PKCE_VERIFIER_KEY, value: verifier });

        const redirectUri = getReverseDnsRedirectUri(nativeClientId);
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
          client_id: nativeClientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: GOOGLE_SCOPES,
          code_challenge: challenge,
          code_challenge_method: 'S256',
          access_type: 'offline',
          prompt: 'consent',
        }).toString();

        await Browser.open({ url: authUrl, windowName: '_system' });
        return;
      } catch (err) {
        console.error('Native OAuth browser launch error:', err);
        if (onError) onError(err);
      }
    } else if (typeof window !== 'undefined' && window.google && window.google.accounts) {
      // Web / Desktop Browser GIS Flow
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
      if (config.clientSecret) {
        params.append('client_secret', config.clientSecret);
      }

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

    return { token: null, status: SYNC_STATUS.AUTH_ERROR };
  }
}
