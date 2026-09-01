const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (data) => ipcRenderer.invoke('state:save', data),
  getAuthState: () => ipcRenderer.invoke('auth:getState'),
  signIn: () => ipcRenderer.invoke('auth:signIn'),
  signOut: () => ipcRenderer.invoke('auth:signOut'),
  syncNow: () => ipcRenderer.invoke('sync:now'),
  getSyncStatus: () => ipcRenderer.invoke('sync:getStatus'),
  onSyncStatusChange: (callback) => {
    const listener = (_event, val) => callback(val);
    ipcRenderer.on('sync:status-changed', listener);
    return () => ipcRenderer.removeListener('sync:status-changed', listener);
  },
  onDataUpdated: (callback) => {
    const listener = (_event, val) => callback(val);
    ipcRenderer.on('data:updated', listener);
    return () => ipcRenderer.removeListener('data:updated', listener);
  },
  getGoogleConfig: () => ipcRenderer.invoke('config:getGoogleConfig'),
  saveGoogleConfig: (config) => ipcRenderer.invoke('config:saveGoogleConfig', config),
});

// Legacy backward-compatibility bridge
contextBridge.exposeInMainWorld('electronAuth', {
  login: () => ipcRenderer.invoke('auth:signIn'),
  getTokens: () => ipcRenderer.invoke('auth:getTokens'),
  refreshToken: () => ipcRenderer.invoke('auth:refreshToken'),
  logout: () => ipcRenderer.invoke('auth:signOut'),
});
