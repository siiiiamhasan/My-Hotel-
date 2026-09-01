import React, { useState, useRef, useEffect } from 'react';
import { 
  Cloud, 
  RefreshCw, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  Smartphone,
  Copy,
  Check,
  AlertCircle,
  Key,
  Mail,
  HelpCircle,
  LogIn,
  LogOut,
  Zap,
  Info
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { exportDataAsJSON } from '../../utils/storage';
import { 
  getGoogleConfig, 
  saveGoogleConfig 
} from '../../utils/googleDrive';
import { DesktopDeleteConfirmModal } from '../components/DesktopDeleteConfirmModal';
import { DesktopModal } from '../components/DesktopModal';

export const DesktopCloudSettingsScreen = () => {
  const { 
    data, 
    syncing, 
    syncStatus,
    lastSyncedAt,
    triggerGoogleDriveSync, 
    disconnectGoogleDrive, 
    signInWithGoogle,
    resetData, 
    importData, 
    updateRestaurantInfo 
  } = useAppData();

  const [copySuccess, setCopySuccess] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [emailInput, setEmailInput] = useState(data?.restaurant_info?.google_account_email || '');
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadConfig = async () => {
      if (typeof window !== 'undefined' && window.api?.getGoogleConfig) {
        try {
          const config = await window.api.getGoogleConfig();
          if (config?.clientId) setClientIdInput(config.clientId);
          if (config?.clientSecret) setClientSecretInput(config.clientSecret);
        } catch (e) {}
      } else {
        const config = await getGoogleConfig();
        if (config?.clientId) setClientIdInput(config.clientId);
        if (config?.clientSecret) setClientSecretInput(config.clientSecret);
      }
    };
    loadConfig();
  }, []);

  const isConnected = !!data?.restaurant_info?.google_drive_connected;
  const googleEmail = data?.restaurant_info?.google_account_email || (isConnected ? 'Google Account Connected' : 'Not connected');
  const lastSyncFormatted = (lastSyncedAt || data?.restaurant_info?.last_synced_at)
    ? new Date(lastSyncedAt || data.restaurant_info.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Never';

  const handleSaveCredentials = async () => {
    if (typeof window !== 'undefined' && window.api?.saveGoogleConfig) {
      await window.api.saveGoogleConfig({
        clientId: clientIdInput.trim(),
        clientSecret: clientSecretInput.trim(),
      });
    } else {
      await saveGoogleConfig({
        clientId: clientIdInput.trim(),
        clientSecret: clientSecretInput.trim(),
      });
    }
    updateRestaurantInfo({
      google_account_email: emailInput.trim(),
    });
    setIsEditingConfig(false);
    setStatusMessage({ type: 'success', text: 'Google OAuth credentials saved.' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage({ type: 'info', text: 'Opening Google authentication window in your default browser...' });

    try {
      const res = await signInWithGoogle();
      if (res?.success) {
        setStatusMessage({ type: 'success', text: `Connected as ${res.userEmail || 'Google User'}. Database synced.` });
      } else if (res?.error) {
        setStatusMessage({ type: 'error', text: `Google Sign-in: ${res.error}` });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Sign-in error: ${err.message}` });
    } finally {
      setIsSigningIn(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGoogleDrive();
    setStatusMessage({ type: 'success', text: 'Disconnected from Google Drive. Stored tokens cleared.' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSyncNow = async () => {
    setStatusMessage(null);
    const res = await triggerGoogleDriveSync();
    if (res?.success) {
      const actionText = res.action === 'PULLED_FROM_DRIVE' 
        ? 'Latest database retrieved from Google Drive.'
        : res.action === 'PUSHED_TO_DRIVE'
        ? 'Uploaded latest records to Google Drive.'
        : 'Synchronized with local storage.';
      setStatusMessage({ type: 'success', text: actionText });
    } else {
      setStatusMessage({ type: 'error', text: `Sync status: ${res?.error || res?.status || 'Could not connect to Drive'}` });
    }
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleDownloadJSON = () => {
    const jsonContent = exportDataAsJSON(data);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel_master_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        const res = await importData(content);
        if (res.success) {
          setStatusMessage({ type: 'success', text: 'Database restored successfully from backup file.' });
        } else {
          setStatusMessage({ type: 'error', text: `Failed to restore: ${res.error}` });
        }
        setTimeout(() => setStatusMessage(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportCSV = () => {
    let csv = 'Date,Cash Sales,Digital Sales,Total Sales,Market Cost,Pocket Money,Staff Advances,Wastage,Night Float,Bank Deposit\n';
    (data.daily_records || []).forEach(r => {
      const marketCost = (r.morning_market || []).reduce((s, i) => s + Number(i.amount || 0), 0);
      const pocketCost = (r.owner_drawings || []).reduce((s, i) => s + Number(i.amount || 0), 0);
      const staffAdv = (r.staff_advances || []).reduce((s, i) => s + Number(i.amount || 0), 0);
      const wastage = (r.wastage_demurrage || []).reduce((s, i) => s + Number(i.amount || 0), 0);
      const cSales = Number(r.sales?.cash_sales || 0);
      const dSales = Number(r.sales?.digital_sales || 0);
      const float = Number(r.night_closing?.next_day_opening_float || 0);
      const bank = Number(r.night_closing?.bank_deposit || 0);

      csv += `${r.date},${cSales},${dSales},${cSales + dSales},${marketCost},${pocketCost},${staffAdv},${wastage},${float},${bank}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel_financial_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(exportDataAsJSON(data));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json,application/json"
        style={{ display: 'none' }}
      />

      {/* Reset Confirmation Modal */}
      <DesktopDeleteConfirmModal
        visible={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          resetData();
          setStatusMessage({ type: 'success', text: 'Database reset to clean baseline.' });
          setTimeout(() => setStatusMessage(null), 4000);
        }}
        title="Reset All Hotel Records?"
        itemName="All Records & Logs"
        description="All daily logs, morning bazar items, sales, and employee advance entries will be cleared."
      />

      {/* Google Credentials Setup Guide Modal */}
      <DesktopModal
        visible={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        title="Google OAuth Credentials Setup"
        subtitle="One-time 5-minute setup in Google Cloud Console"
      >
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text-main)' }}>Step 1: Open Google Cloud Console</strong>
            <div>Go to <code>console.cloud.google.com</code> and create a new project (e.g. "My Hotel Manager").</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text-main)' }}>Step 2: Enable Google Drive API</strong>
            <div>Go to <strong>APIs & Services &gt; Library</strong>, search for <strong>Google Drive API</strong> and click <strong>Enable</strong>.</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text-main)' }}>Step 3: OAuth Consent Screen</strong>
            <div>Select <strong>External</strong>, set App Name, add your Gmail as a <strong>Test User</strong>, and save.</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text-main)' }}>Step 4: Create OAuth Desktop Credentials</strong>
            <div>Go to <strong>Credentials &gt; Create Credentials &gt; OAuth client ID</strong>. Application type: <strong>Desktop app</strong>. Copy the <strong>Client ID</strong> and paste into <code>config/google-config.json</code> or the credentials box here.</div>
          </div>
        </div>
      </DesktopModal>

      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
          Google Drive Cloud Sync & Database Center
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          Google Drive v3 REST API, automated 1.5s debounced cloud sync, safe encrypted caching, and manual JSON/CSV exports
        </p>
      </div>

      {/* Status Alert Banner */}
      {statusMessage ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 18px',
          borderRadius: 12,
          marginBottom: 20,
          backgroundColor: statusMessage.type === 'error' ? 'var(--rose-light)' : 'var(--bg-card-secondary)',
          color: statusMessage.type === 'error' ? 'var(--rose)' : 'var(--text-main)',
          border: `1px solid ${statusMessage.type === 'error' ? 'rgba(220, 38, 38, 0.3)' : 'var(--border-color)'}`,
          fontSize: 13,
          fontWeight: 700,
        }}>
          {statusMessage.type === 'error' ? <AlertCircle size={17} /> : <Check size={17} />}
          <span>{statusMessage.text}</span>
        </div>
      ) : null}

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column: Drive Cloud Status & Configuration */}
        <div>
          <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: isConnected ? '#F0FDF4' : 'var(--bg-card-secondary)',
                  border: isConnected ? '1.5px solid #86EFAC' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Cloud size={24} color={isConnected ? '#16A34A' : 'var(--text-main)'} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>Google Drive Cloud Sync</h2>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: isConnected ? '#DCFCE7' : 'var(--bg-card-secondary)',
                      color: isConnected ? '#166534' : 'var(--text-secondary)',
                    }}>
                      {isConnected ? 'Active & Synced' : 'Not Connected'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{googleEmail}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setGuideModalOpen(true)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                  }}
                >
                  Setup Guide
                </button>
                <button
                  onClick={() => setIsEditingConfig(!isEditingConfig)}
                  style={{
                    backgroundColor: 'var(--bg-card-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                  }}
                >
                  {isEditingConfig ? 'Close' : 'Credentials'}
                </button>
              </div>
            </div>

            {/* Debounced Sync Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: 16,
            }}>
              <Zap size={16} color="var(--primary)" />
              <span>Auto-sync enabled: saves locally instantly & syncs to Google Drive ~1.5s after editing</span>
            </div>

            {/* Credentials Config Form */}
            {isEditingConfig ? (
              <div style={{ backgroundColor: 'var(--bg-card-secondary)', padding: 16, borderRadius: 12, marginBottom: 18 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Google OAuth Client ID
                  </label>
                  <input
                    className="input-field"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxxxx.apps.googleusercontent.com"
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Client Secret (Optional / Baked in config/google-config.json)
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={clientSecretInput}
                    onChange={(e) => setClientSecretInput(e.target.value)}
                    placeholder="GOCSPX-xxxxxxxx..."
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Gmail Account Email
                  </label>
                  <input
                    className="input-field"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your.hotel@gmail.com"
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleSaveCredentials}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    Save Credentials
                  </button>
                  <button
                    onClick={handleGoogleSignIn}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 18px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                    }}
                  >
                    <LogIn size={15} />
                    <span>Sign In with Google</span>
                  </button>
                </div>
              </div>
            ) : null}

            <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '12px 0', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Master DB File on Drive:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>hotel-management-data.json</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Last Synced:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{lastSyncFormatted}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: 13.5,
                  backgroundColor: syncing ? 'var(--bg-card-secondary)' : 'var(--primary)',
                  color: syncing ? 'var(--text-secondary)' : '#FFFFFF',
                }}
              >
                <RefreshCw size={16} className={syncing ? 'spin-animation' : ''} />
                <span>{syncing ? 'Synchronizing with Drive...' : 'Sync Now (Push & Pull)'}</span>
              </button>

              {!isConnected ? (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 20px',
                    backgroundColor: isSigningIn ? 'var(--bg-card-secondary)' : '#FFFFFF',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 800,
                    color: isSigningIn ? 'var(--text-secondary)' : 'var(--text-main)',
                    cursor: isSigningIn ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSigningIn ? (
                    <RefreshCw size={15} className="spin-animation" />
                  ) : (
                    <LogIn size={15} color="var(--primary)" />
                  )}
                  <span>{isSigningIn ? 'Connecting...' : 'Connect Google Drive'}</span>
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 18px',
                    backgroundColor: 'var(--rose-light)',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 800,
                    color: 'var(--rose)',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={15} />
                  <span>Disconnect</span>
                </button>
              )}
            </div>
          </div>

          {/* Security & Architecture Specs */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
              Security & Storage Architecture
            </h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)' }}>Strict drive.file Scope:</strong> The app only accesses <code>hotel-management-data.json</code> that it creates. It has zero access to any other files or folders in your Google Drive.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <Database size={18} color="#2563EB" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)' }}>Local Encrypted Cache & Keychain:</strong> Tokens are encrypted using Electron <code>safeStorage</code> (OS Keychain / Windows DPAPI). Data is always saved locally in <code>local-cache.json</code> and backed up in <code>local-cache.json.bak</code>.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Smartphone size={18} color="#7C3AED" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)' }}>Cross-Platform Multi-Device Sync:</strong> Changes made on PC or Mobile auto-sync through your central Google Drive JSON database.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Backup, Restore & Reset */}
        <div>
          <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)', marginBottom: 14 }}>
              Backup, Restore & Exports
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <button
                onClick={handleDownloadJSON}
                className="btn-primary"
                style={{ backgroundColor: '#FFFFFF', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: 12 }}
              >
                <Download size={16} />
                <span>Backup JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                style={{ backgroundColor: '#FFFFFF', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: 12 }}
              >
                <Upload size={16} />
                <span>Restore JSON</span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="btn-primary"
              style={{ width: '100%', backgroundColor: '#FFFFFF', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: 12, marginBottom: 14 }}
            >
              <FileSpreadsheet size={16} />
              <span>Export Financial Accounts to CSV</span>
            </button>

            <button
              onClick={() => setResetConfirmOpen(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px',
                borderRadius: 10,
                border: '1px solid rgba(220, 38, 38, 0.3)',
                backgroundColor: 'var(--rose-light)',
                color: 'var(--rose)',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
              <span>Reset to Clean Starting State</span>
            </button>
          </div>

          {/* Raw JSON viewer */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>Raw Master Database</h3>
              <button
                onClick={handleCopyJSON}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-main)',
                }}
              >
                <Copy size={12} />
                <span>{copySuccess ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="font-mono" style={{
              backgroundColor: '#0F172A',
              padding: 14,
              borderRadius: 10,
              maxHeight: 220,
              overflowY: 'auto',
              fontSize: 11,
              color: '#E2E8F0',
              lineHeight: 1.4,
            }}>
              {exportDataAsJSON(data)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
