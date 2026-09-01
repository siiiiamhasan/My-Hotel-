import React, { useState, useRef, useEffect } from 'react';
import { 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  WifiOff, 
  LogIn, 
  LogOut, 
  User, 
  ExternalLink,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const SyncBadge = ({ onNavigateToCloudSettings }) => {
  const { 
    syncStatus, 
    syncing, 
    lastSyncedAt, 
    data,
    triggerGoogleDriveSync, 
    disconnectGoogleDrive,
    signInWithGoogle
  } = useAppData();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isConnected = !!data?.restaurant_info?.google_drive_connected;
  const userEmail = data?.restaurant_info?.google_account_email || '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatLastSync = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return 'Recently';
    }
  };

  const handleManualSync = async (e) => {
    e.stopPropagation();
    await triggerGoogleDriveSync();
  };

  const handleSignOut = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    await disconnectGoogleDrive();
  };

  const handleSignIn = async (e) => {
    e.stopPropagation();
    await signInWithGoogle();
  };

  // Render Badge Button based on status
  const renderBadgeContent = () => {
    if (syncStatus === 'syncing' || syncing) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #FCD34D',
          padding: '6px 12px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
        }}>
          <RefreshCw size={14} className="spin-animation" />
          <span>Syncing...</span>
        </div>
      );
    }

    if (syncStatus === 'offline') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          border: '1px solid #CBD5E1',
          padding: '6px 12px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}>
          <WifiOff size={14} />
          <span>Offline</span>
        </div>
      );
    }

    if (syncStatus === 'error') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FCA5A5',
          padding: '6px 12px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}>
          <AlertCircle size={14} />
          <span>Sync Error</span>
        </div>
      );
    }

    if (isConnected) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          backgroundColor: '#F0FDF4',
          color: '#166534',
          border: '1px solid #86EFAC',
          padding: '6px 12px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <Cloud size={14} color="#16A34A" />
          <span>Synced</span>
          <ChevronDown size={13} style={{ marginLeft: 2, opacity: 0.7 }} />
        </div>
      );
    }

    // Not connected: Sign in button
    return (
      <button
        onClick={handleSignIn}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          backgroundColor: '#FFFFFF',
          color: 'var(--text-main)',
          border: '1.5px solid #E2E8F0',
          padding: '6px 14px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease',
        }}
      >
        <LogIn size={14} color="var(--primary)" />
        <span>Sign in with Google</span>
      </button>
    );
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div onClick={() => isConnected && setIsOpen(!isOpen)}>
        {renderBadgeContent()}
      </div>

      {/* Interactive Dropdown Menu */}
      {isOpen && isConnected && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '300px',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.15), 0 4px 12px rgba(15, 23, 42, 0.08)',
          border: '1px solid #E2E8F0',
          padding: '16px',
          zIndex: 100,
          animation: 'fadeIn 0.15s ease-out',
        }}>
          {/* Header with User Email */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingBottom: 12,
            borderBottom: '1px solid #F1F5F9',
            marginBottom: 12,
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
              flexShrink: 0,
            }}>
              <User size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Google Drive Connected
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {userEmail || 'Active Google Account'}
              </div>
            </div>
          </div>

          {/* Sync Metadata Details */}
          <div style={{
            backgroundColor: '#F8FAFC',
            padding: '10px 12px',
            borderRadius: 10,
            marginBottom: 14,
            fontSize: 11.5,
            color: 'var(--text-secondary)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Database File:</span>
              <strong style={{ color: 'var(--text-main)' }}>hotel-management-data.json</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Last Synced:</span>
              <strong style={{ color: 'var(--text-main)' }}>{formatLastSync(lastSyncedAt || data?.restaurant_info?.last_synced_at)}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#059669', fontWeight: 700, marginTop: 6, fontSize: 11 }}>
              <ShieldCheck size={13} />
              <span>Auto-syncs 1.5s after any edit</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                backgroundColor: syncing ? '#F1F5F9' : 'var(--primary)',
                color: syncing ? '#64748B' : '#FFFFFF',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: syncing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={14} className={syncing ? 'spin-animation' : ''} />
              <span>{syncing ? 'Syncing with Drive...' : 'Sync Now'}</span>
            </button>

            {onNavigateToCloudSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToCloudSettings();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-secondary)',
                  border: '1px solid #E2E8F0',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={13} />
                <span>Backup & Cloud Settings</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                backgroundColor: '#FFF1F2',
                color: '#E11D48',
                border: '1px solid #FECDD3',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <LogOut size={13} />
              <span>Sign out of Google</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
