const { shell } = require('electron');
const http = require('http');
const crypto = require('crypto');
const { getTokens, saveTokens, clearTokens, getGoogleConfig } = require('./store.cjs');
const { fetchUserProfile } = require('./drive.cjs');

const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

/**
 * Perform PKCE OAuth 2.0 Authorization Flow on Local Loopback HTTP Server
 */
async function startDesktopPKCEAuth() {
  const config = getGoogleConfig();
  const clientId = config.desktopClientId || config.clientId || '';
  const clientSecret = config.desktopClientSecret || config.clientSecret || '';

  return new Promise((resolve, reject) => {
    // 1. Generate PKCE Code Verifier & S256 Challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    let serverClosed = false;

    let loopbackPort = 0;
    let redirectUri = '';

    // 2. Start Local Loopback Server
    const server = http.createServer(async (req, res) => {
      try {
        if (req.url && req.url.startsWith('/callback')) {
          const urlParams = new URL(req.url, 'http://127.0.0.1');
          const code = urlParams.searchParams.get('code');
          const error = urlParams.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head><title>Sign-in Failed</title></head>
                <body style="font-family: system-ui, sans-serif; text-align: center; padding: 60px; background: #FFF1F2; color: #9F1239;">
                  <h2>Authentication Failed</h2>
                  <p>${error}</p>
                </body>
              </html>
            `);
            if (!serverClosed) { serverClosed = true; try { server.close(); } catch (e) {} }
            reject(new Error(error));
            return;
          }

          // Render Success Page
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <title>Signed In Successfully</title>
                <style>
                  * { box-sizing: border-box; margin: 0; padding: 0; }
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background: linear-gradient(135deg, #F0FDF4 0%, #E0F2FE 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    color: #0F172A;
                  }
                  .card {
                    background: #FFFFFF;
                    max-width: 460px;
                    width: 100%;
                    padding: 40px 32px;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08);
                    text-align: center;
                    border: 1px solid #E2E8F0;
                  }
                  .icon-wrap {
                    width: 64px;
                    height: 64px;
                    background: #DCFCE7;
                    color: #059669;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px auto;
                    font-size: 32px;
                  }
                  h1 { font-size: 22px; font-weight: 800; color: #0F172A; margin-bottom: 10px; }
                  p { font-size: 14px; color: #64748B; line-height: 1.6; margin-bottom: 24px; }
                  .badge {
                    display: inline-block;
                    background: #F1F5F9;
                    padding: 6px 14px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #334155;
                  }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="icon-wrap">✓</div>
                  <h1>Connected to Google Drive!</h1>
                  <p>Your Google Drive cloud backup is now active for <strong>My Hotel Manager</strong>. You can safely close this browser tab and return to the application.</p>
                  <div class="badge">Signed in ✅</div>
                </div>
              </body>
            </html>
          `);

          // Safely close loopback server after completing request
          setTimeout(() => {
            if (!serverClosed) {
              serverClosed = true;
              try { server.close(); } catch (e) {}
            }
          }, 1000);

          const currentRedirectUri = redirectUri || `http://127.0.0.1:${loopbackPort}/callback`;

          // 3. Exchange Authorization Code for Tokens
          const bodyParams = {
            client_id: clientId,
            code: code,
            code_verifier: codeVerifier,
            grant_type: 'authorization_code',
            redirect_uri: currentRedirectUri,
          };
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
            throw new Error(`Token exchange failed (${tokenRes.status}): ${errText}`);
          }

          const tokenData = await tokenRes.json();
          const tokens = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
          };

          // Fetch user details
          const profile = await fetchUserProfile(tokens.accessToken);
          if (profile) {
            tokens.userEmail = profile.email;
            tokens.userName = profile.name;
            tokens.userPicture = profile.picture;
          }

          saveTokens(tokens);
          resolve(tokens);
        }
      } catch (err) {
        if (!serverClosed) {
          serverClosed = true;
          try { server.close(); } catch (e) {}
        }
        reject(err);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      loopbackPort = server.address().port;
      redirectUri = `http://127.0.0.1:${loopbackPort}/callback`;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: DRIVE_SCOPES,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent',
      }).toString();

      shell.openExternal(authUrl);
    });

    server.on('error', (err) => {
      if (!serverClosed) {
        serverClosed = true;
        try { server.close(); } catch (e) {}
      }
      reject(err);
    });
  });
}

/**
 * Silently Refresh Access Token using Refresh Token
 */
async function refreshDesktopAccessToken() {
  const tokens = getTokens();
  if (!tokens || !tokens.refreshToken) return null;

  const config = getGoogleConfig();
  const clientId = config.desktopClientId || config.clientId || '';
  const clientSecret = config.desktopClientSecret || config.clientSecret || '';

  try {
    const bodyParams = {
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    };
    if (clientSecret) {
      bodyParams.client_secret = clientSecret;
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(bodyParams),
    });

    if (!res.ok) {
      console.warn('Refresh token rejected:', await res.text());
      return null;
    }

    const data = await res.json();
    const updated = {
      ...tokens,
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    saveTokens(updated);
    return updated.accessToken;
  } catch (err) {
    console.error('Failed to refresh access token:', err);
    return null;
  }
}

/**
 * Get Valid Access Token (refreshes silently if near expiry)
 */
async function getValidAccessToken() {
  const tokens = getTokens();
  if (!tokens || !tokens.accessToken) return null;

  const isExpired = tokens.expiresAt && Date.now() >= tokens.expiresAt - 60000;
  if (!isExpired) {
    return tokens.accessToken;
  }

  return await refreshDesktopAccessToken();
}

/**
 * Clear Authentication State
 */
function clearAuth() {
  clearTokens();
}

module.exports = {
  startDesktopPKCEAuth,
  refreshDesktopAccessToken,
  getValidAccessToken,
  clearAuth,
};
