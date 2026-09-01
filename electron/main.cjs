const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {
  loadState,
  saveState,
  getTokens,
  getFileId,
  setFileId,
  clearFileId,
  getGoogleConfig,
  saveGoogleConfig,
} = require('./store.cjs');
const {
  startDesktopPKCEAuth,
  getValidAccessToken,
  refreshDesktopAccessToken,
  clearAuth,
} = require('./auth.cjs');
const {
  findFileId,
  downloadFile,
  createFile,
  updateFile,
} = require('./drive.cjs');

let mainWindow = null;
let syncDebounceTimer = null;
let currentSyncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'unauthenticated'
let lastSyncedAt = null;
let lastSyncError = null;

function broadcastSyncStatus(status, error = null) {
  currentSyncStatus = status;
  lastSyncError = error;
  if (status === 'synced') {
    lastSyncedAt = new Date().toISOString();
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync:status-changed', {
      status: currentSyncStatus,
      lastSyncedAt,
      error: lastSyncError,
    });
  }
}

function broadcastDataUpdated(newData) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('data:updated', newData);
  }
}

/**
 * --- BACKGROUND DRIVE SYNC ENGINE ---
 */
function resolveConflict(localData, remoteData) {
  if (!remoteData) return localData;
  if (!localData) return remoteData;

  const localTime = new Date(localData?.updatedAt || localData?.restaurant_info?.last_synced_at || 0).getTime();
  const remoteTime = new Date(remoteData?.updatedAt || remoteData?.restaurant_info?.last_synced_at || 0).getTime();

  // If remote data was modified strictly more recently, accept remote
  if (remoteTime > localTime) {
    return {
      ...remoteData,
      restaurant_info: {
        ...(remoteData.restaurant_info || {}),
        google_drive_connected: true,
        last_synced_at: new Date().toISOString(),
      }
    };
  }

  // Local is newer or equal
  return {
    ...localData,
    restaurant_info: {
      ...(localData.restaurant_info || {}),
      google_drive_connected: true,
      last_synced_at: new Date().toISOString(),
    }
  };
}

async function pushToDrive(data) {
  const token = await getValidAccessToken();
  if (!token) {
    broadcastSyncStatus('unauthenticated');
    return { success: false, error: 'Unauthenticated' };
  }

  try {
    broadcastSyncStatus('syncing');
    let fileId = getFileId();

    // If fileId is not cached locally, scan Google Drive
    if (!fileId) {
      fileId = await findFileId(token);
      if (fileId) {
        setFileId(fileId);
      }
    }

    if (fileId) {
      await updateFile(token, fileId, data);
    } else {
      const newFileId = await createFile(token, data);
      setFileId(newFileId);
    }

    broadcastSyncStatus('synced');
    return { success: true, action: 'PUSHED_TO_DRIVE' };
  } catch (err) {
    console.error('pushToDrive error:', err);
    // If file was deleted remotely, clear cached fileId to re-scan next time
    if (err.message && err.message.includes('404')) {
      clearFileId();
    }
    broadcastSyncStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

async function pullFromDrive() {
  const token = await getValidAccessToken();
  if (!token) {
    broadcastSyncStatus('unauthenticated');
    return null;
  }

  try {
    broadcastSyncStatus('syncing');
    let fileId = getFileId();

    if (!fileId) {
      fileId = await findFileId(token);
      if (fileId) {
        setFileId(fileId);
      }
    }

    if (fileId) {
      const remoteData = await downloadFile(token, fileId);
      const localData = loadState();

      // Granular entity-level merge: combine cloud master database with local records
      const merged = resolveConflict(localData, remoteData);
      saveState(merged);
      broadcastDataUpdated(merged);

      // Keep cloud file up to date with merged state
      try {
        await updateFile(token, fileId, merged);
      } catch (e) {
        console.warn('Post-pull remote update skipped:', e);
      }

      broadcastSyncStatus('synced');
      return merged;
    } else {
      // File not found on Drive yet, upload current local state
      const localData = loadState();
      if (localData) {
        const newFileId = await createFile(token, localData);
        setFileId(newFileId);
      }
      broadcastSyncStatus('synced');
      return localData;
    }
  } catch (err) {
    console.error('pullFromDrive error:', err);
    if (err.message && err.message.includes('404')) {
      clearFileId();
    }
    broadcastSyncStatus('error', err.message);
    return null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'My Hotel & Restaurant - 5-Star Management',
    icon: path.join(__dirname, '../public/App_logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Prevents CORS blocks on file:// protocol
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: false,
    backgroundColor: '#F8FAFC',
  });

  const distIndex = path.join(__dirname, '../dist/index.html');
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(distIndex);
  }

  // F12 or Ctrl+Shift+I to toggle DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Window failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * --- IPC HANDLERS ---
 */

// 1. Load initial state
ipcMain.handle('state:load', async () => {
  const cachedData = loadState();
  const tokens = getTokens();
  const isConnected = !!(tokens && tokens.accessToken);

  // Trigger background drive pull if connected
  if (isConnected) {
    setTimeout(() => {
      pullFromDrive().catch((e) => console.warn('Startup pull failed:', e));
    }, 500);
  } else {
    broadcastSyncStatus('unauthenticated');
  }

  return {
    data: cachedData,
    isCloudConnected: isConnected,
    userEmail: tokens?.userEmail || null,
    userName: tokens?.userName || null,
    userPicture: tokens?.userPicture || null,
    syncStatus: currentSyncStatus,
    lastSyncedAt,
  };
});

// 2. Save state with debounced drive push (1500ms)
ipcMain.handle('state:save', async (_event, data) => {
  // 1. Instant local persistence
  saveState(data);

  // 2. 1500ms debounced cloud push
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  const tokens = getTokens();
  if (tokens && tokens.accessToken) {
    syncDebounceTimer = setTimeout(() => {
      pushToDrive(data);
    }, 1500);
  }

  return true;
});

// 3. Auth Handlers
ipcMain.handle('auth:signIn', async () => {
  try {
    const tokens = await startDesktopPKCEAuth();
    
    // 1. Immediately search Google Drive, find master JSON file, attach and pull
    let currentData = loadState();
    try {
      const driveData = await pullFromDrive();
      if (driveData) {
        currentData = driveData;
      }
    } catch (e) {
      console.warn('Initial pullFromDrive on signin failed:', e);
    }

    if (currentData) {
      currentData.restaurant_info = {
        ...(currentData.restaurant_info || {}),
        google_drive_connected: true,
        google_account_email: tokens.userEmail || currentData.restaurant_info?.google_account_email,
        last_synced_at: new Date().toISOString(),
      };
      saveState(currentData);
      broadcastDataUpdated(currentData);
    }

    broadcastSyncStatus('synced');

    return {
      success: true,
      userEmail: tokens.userEmail,
      userName: tokens.userName,
      userPicture: tokens.userPicture,
      data: currentData,
    };
  } catch (err) {
    console.error('auth:signIn failed:', err);
    broadcastSyncStatus('error', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth:signOut', async () => {
  clearAuth();
  clearFileId();
  const currentData = loadState();
  if (currentData) {
    currentData.restaurant_info = {
      ...(currentData.restaurant_info || {}),
      google_drive_connected: false,
    };
    saveState(currentData);
    broadcastDataUpdated(currentData);
  }
  broadcastSyncStatus('unauthenticated');
  return true;
});

ipcMain.handle('auth:getState', async () => {
  const tokens = getTokens();
  return {
    isConnected: !!(tokens && tokens.accessToken),
    userEmail: tokens?.userEmail || null,
    userName: tokens?.userName || null,
    userPicture: tokens?.userPicture || null,
  };
});

// 4. Manual Sync Trigger (Pull & Push)
ipcMain.handle('sync:now', async () => {
  const pullResult = await pullFromDrive();
  const currentLocal = loadState();
  if (currentLocal) {
    await pushToDrive(currentLocal);
  }
  return {
    success: true,
    data: currentLocal,
    status: currentSyncStatus,
    lastSyncedAt,
  };
});

ipcMain.handle('sync:getStatus', async () => {
  const tokens = getTokens();
  return {
    status: currentSyncStatus,
    lastSyncedAt,
    error: lastSyncError,
    isConnected: !!(tokens && tokens.accessToken),
    userEmail: tokens?.userEmail || null,
  };
});

// 5. Config Management
ipcMain.handle('config:getGoogleConfig', async () => {
  return getGoogleConfig();
});

ipcMain.handle('config:saveGoogleConfig', async (_event, config) => {
  return saveGoogleConfig(config);
});

// Legacy backward-compatibility handles
ipcMain.handle('oauth:login', async () => startDesktopPKCEAuth());
ipcMain.handle('oauth:getTokens', async () => getTokens());
ipcMain.handle('oauth:refreshToken', async () => refreshDesktopAccessToken());
ipcMain.handle('oauth:logout', async () => {
  clearAuth();
  return true;
});
ipcMain.handle('auth:getTokens', async () => getTokens());
ipcMain.handle('auth:refreshToken', async () => refreshDesktopAccessToken());

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
