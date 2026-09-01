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
  Key,
  Mail,
  Check,
  AlertCircle,
  HelpCircle,
  LogIn,
  LogOut,
  Zap
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { exportDataAsJSON } from '../../utils/storage';
import { 
  getGoogleConfig, 
  saveGoogleConfig, 
  getValidAccessToken
} from '../../utils/googleDrive';
import { CustomModal } from '../components/Modal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const CloudSettingsScreen = () => {
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

  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
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
        if (config.clientId) setClientIdInput(config.clientId);
        if (config.clientSecret) setClientSecretInput(config.clientSecret);
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
    setStatusMessage({ type: 'info', text: 'Opening Google authentication prompt...' });

    try {
      const res = await signInWithGoogle();
      if (res?.success) {
        setStatusMessage({ type: 'success', text: `Connected as ${res.userEmail || 'Google User'}. Synced.` });
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
    <div style={{ padding: '12px 14px', paddingBottom: '90px' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json,application/json"
        style={{ display: 'none' }}
      />

      {/* Delete / Reset Modal */}
      <DeleteConfirmModal
        visible={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          resetData();
          setStatusMessage({ type: 'success', text: 'Database reset to clean baseline.' });
          setTimeout(() => setStatusMessage(null), 4000);
        }}
        title="Reset All Records?"
        itemName="All Logs & Data"
        description="All entered bazar items, sales, and employee advances will be cleared."
      />

      {/* Setup Guide Modal */}
      <CustomModal
        visible={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        title="Google OAuth Credentials Setup"
        subtitle="One-time 5-minute setup in Google Cloud Console"
      >
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div style={{ marginBottom: 10 }}>
            <strong style={{ color: 'var(--text-main)' }}>Step 1: Open Google Cloud Console</strong>
            <div>Go to <code>console.cloud.google.com</code> and create a new project (e.g. "My Hotel").</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong style={{ color: 'var(--text-main)' }}>Step 2: Enable Google Drive API</strong>
            <div>Go to <strong>APIs & Services &gt; Library</strong>, search for <strong>Google Drive API</strong> and click <strong>Enable</strong>.</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong style={{ color: 'var(--text-main)' }}>Step 3: OAuth consent screen</strong>
            <div>Select <strong>External</strong>, set App Name, add your Gmail as a <strong>Test User</strong>, and save.</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong style={{ color: 'var(--text-main)' }}>Step 4: Create OAuth Desktop Credentials</strong>
            <div>Go to <strong>Credentials &gt; Create Credentials &gt; OAuth client ID</strong>. Application type: <strong>Desktop app</strong> (or Web). Copy the <strong>Client ID</strong> and paste into <code>config/google-config.json</code> or the credentials form.</div>
          </div>
        </div>
      </CustomModal>

      {/* Raw JSON Modal */}
      <CustomModal
        visible={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        title="Master Database JSON"
        subtitle="Current state stored in local database & Drive"
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
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
            padding: 12,
            borderRadius: 10,
            maxHeight: 260,
            overflowY: 'auto',
            fontSize: 11,
            color: '#E2E8F0',
            lineHeight: 1.4,
          }}>
            {exportDataAsJSON(data)}
          </pre>
        </div>
      </CustomModal>

      {/* Title */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
          Cloud & Local Database Center
        </h2>
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 1 }}>
          Google Drive v3 REST API, automated 1.5s debounced sync & manual offline exports
        </p>
      </div>

      {/* Status Alert Banner */}
      {statusMessage ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 12px',
          borderRadius: 10,
          marginBottom: 12,
          backgroundColor: statusMessage.type === 'error' ? 'var(--rose-light)' : 'var(--bg-card-secondary)',
          color: statusMessage.type === 'error' ? 'var(--rose)' : 'var(--text-main)',
          border: `1px solid ${statusMessage.type === 'error' ? 'rgba(220, 38, 38, 0.3)' : 'var(--border-color)'}`,
          fontSize: 12,
          fontWeight: 700,
        }}>
          {statusMessage.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
          <span>{statusMessage.text}</span>
        </div>
      ) : null}

      {/* 1. Google Drive Cloud Sync Card */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: isConnected ? '#F0FDF4' : 'var(--bg-card-secondary)',
              border: isConnected ? '1.5px solid #86EFAC' : '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Cloud size={20} color={isConnected ? '#16A34A' : 'var(--text-main)'} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--text-main)' }}>Google Drive Sync</h3>
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  backgroundColor: isConnected ? '#DCFCE7' : 'var(--bg-card-secondary)',
                  color: isConnected ? '#166534' : 'var(--text-secondary)',
                }}>
                  {isConnected ? 'Active' : 'Offline'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{googleEmail}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setGuideModalOpen(true)}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 10.5,
                fontWeight: 700,
                cursor: 'pointer',
                color: 'var(--text-main)',
              }}
            >
              Guide
            </button>
            <button
              onClick={() => setIsEditingConfig(!isEditingConfig)}
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 10.5,
                fontWeight: 700,
                cursor: 'pointer',
                color: 'var(--text-main)',
              }}
            >
              {isEditingConfig ? 'Close' : 'Config'}
            </button>
          </div>
        </div>

        {/* Debounced Sync Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 10px',
          borderRadius: 8,
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          marginBottom: 12,
        }}>
          <Zap size={13} color="var(--primary)" />
          <span>Auto-sync: saves locally instantly & syncs to Drive ~1.5s after editing</span>
        </div>

        {/* Config Form */}
        {isEditingConfig ? (
          <div style={{ backgroundColor: 'var(--bg-card-secondary)', padding: 12, borderRadius: 10, marginBottom: 12 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                OAuth Client ID
              </label>
              <input
                className="input-field"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="xxxxxx.apps.googleusercontent.com"
                style={{ fontSize: 11, padding: '7px 10px' }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Gmail Address
              </label>
              <input
                className="input-field"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your.hotel@gmail.com"
                style={{ fontSize: 11, padding: '7px 10px' }}
              />
            </div>

            <button
              onClick={handleSaveCredentials}
              className="btn-primary"
              style={{ width: '100%', padding: '8px', fontSize: 11.5 }}
            >
              Save Credentials
            </button>
          </div>
        ) : null}

        <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '8px 0', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>File on Drive:</span>
            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>hotel-management-data.json</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Last Synced:</span>
            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{lastSyncFormatted}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 12,
              backgroundColor: syncing ? 'var(--bg-card-secondary)' : 'var(--primary)',
              color: syncing ? 'var(--text-secondary)' : '#FFFFFF',
            }}
          >
            <RefreshCw size={14} className={syncing ? 'spin-animation' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {!isConnected ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '10px 14px',
                backgroundColor: isSigningIn ? 'var(--bg-card-secondary)' : '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                color: isSigningIn ? 'var(--text-secondary)' : 'var(--text-main)',
                cursor: isSigningIn ? 'not-allowed' : 'pointer',
              }}
            >
              {isSigningIn ? (
                <RefreshCw size={14} className="spin-animation" />
              ) : (
                <LogIn size={14} color="var(--primary)" />
              )}
              <span>{isSigningIn ? 'Connecting...' : 'Connect Drive'}</span>
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                backgroundColor: 'var(--rose-light)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--rose)',
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} />
              <span>Disconnect</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Export & Backup Tools */}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
        Data Backup, Restore & Export
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
        <button
          onClick={handleDownloadJSON}
          className="glass-card"
          style={{ padding: 10, textAlign: 'center', cursor: 'pointer', color: 'var(--text-main)' }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'var(--bg-card-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Download size={16} color="var(--text-main)" />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, marginTop: 6 }}>Backup</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 1 }}>Save JSON</div>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="glass-card"
          style={{ padding: 10, textAlign: 'center', cursor: 'pointer', color: 'var(--text-main)' }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'var(--bg-card-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Upload size={16} color="var(--text-main)" />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, marginTop: 6 }}>Restore</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 1 }}>Load JSON</div>
        </button>

        <button
          onClick={handleExportCSV}
          className="glass-card"
          style={{ padding: 10, textAlign: 'center', cursor: 'pointer', color: 'var(--text-main)' }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'var(--bg-card-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <FileSpreadsheet size={16} color="var(--text-main)" />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, marginTop: 6 }}>CSV Export</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 1 }}>Spreadsheet</div>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
        <button
          onClick={() => setJsonModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-card-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: 11.5,
            fontWeight: 800,
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          <Database size={14} />
          <span>Raw JSON DB</span>
        </button>

        <button
          onClick={() => setResetConfirmOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px',
            borderRadius: 8,
            border: '1px solid rgba(220, 38, 38, 0.3)',
            backgroundColor: 'var(--rose-light)',
            color: 'var(--rose)',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
          <span>Reset All Data</span>
        </button>
      </div>

      {/* 3. Security Info */}
      <div className="glass-card" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-main)' }}>Strict drive.file Scope:</strong> The app only accesses <code>hotel-management-data.json</code> that it creates. Zero access to other files.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Database size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-main)' }}>Local & Cloud Safety:</strong> Tokens are encrypted via OS Keychain. Offline data is safely preserved in <code>local-cache.json</code> and backed up in <code>.bak</code>.
          </div>
        </div>
      </div>
    </div>
  );
};
